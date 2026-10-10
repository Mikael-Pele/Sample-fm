import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";
import { generateSlug } from "../../../lib/slug";
import { ensurePlanCurrent, hasFullAccess, PIXELS_ENABLED } from "../../../lib/plans";
import { findPreviewUrl } from "../../../lib/previewLookup";
import {
  validateCoreFields,
  resolveProOnlyFields,
  sanitizeString,
  SLUG_PATTERN,
  RESERVED_SLUGS,
} from "../../../lib/linkValidation";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: "You must be signed in to create a SmartLink." });
    }

    let user = await prisma.user.findUnique({ where: { id: session.userId } });

    if (!user) {
      return res.status(401).json({ error: "You must be signed in to create a SmartLink." });
    }

    user = await ensurePlanCurrent(prisma, user);

    // ---- Plan gate --------------------------------------------------------
    // Every account starts on a free trial; once that (or a paid year) runs
    // out, existing SmartLinks stay live but new ones need a subscription.
    if (!hasFullAccess(user)) {
      return res.status(402).json({
        error: "Your free trial has ended. Subscribe to Droppa.fm Artist to create new SmartLinks.",
        code: "subscription_required",
      });
    }

    const payload = req.body || {};

    const core = validateCoreFields(payload);
    if (core.error) {
      return res.status(400).json({ error: core.error });
    }
    const {
      artist_name,
      track_title,
      release_date,
      artwork_url,
      gallery,
      platformUrls,
      community_url,
      community_label,
      booking_url,
      booking_label,
      is_presave,
    } = core;

    // ---- Pixels (coming soon) -------------------------------------------
    const { pixel_fb, pixel_tiktok, droppedFields } = resolveProOnlyFields(payload, PIXELS_ENABLED);

    // ---- Custom vanity slug (optional) ----------------------------------
    // e.g. droppa.fm/catch-the-feeling instead of a random string. Falls
    // back to a random slug when left blank; rejected outright (not
    // silently renamed) when it's invalid or already taken, so the artist
    // always knows exactly what link they're getting.
    const requestedSlug = sanitizeString(payload.custom_slug);
    let slug;

    if (requestedSlug) {
      const normalizedSlug = requestedSlug.toLowerCase();

      if (normalizedSlug.length < 3 || normalizedSlug.length > 60) {
        return res.status(400).json({ error: "Custom link must be 3–60 characters long." });
      }
      if (!SLUG_PATTERN.test(normalizedSlug)) {
        return res.status(400).json({
          error: "Custom link can only contain lowercase letters, numbers, and single hyphens.",
        });
      }
      if (RESERVED_SLUGS.has(normalizedSlug)) {
        return res.status(400).json({ error: "That custom link is reserved. Please choose another." });
      }

      const existing = await prisma.smartLink.findUnique({ where: { slug: normalizedSlug } });
      if (existing) {
        return res.status(409).json({ error: "That custom link is already taken." });
      }

      slug = normalizedSlug;
    } else {
      slug = generateSlug(7);
    }

    // ---- 5-second audio preview (best-effort, never blocks creation) ----
    // We don't use Spotify's API here (new apps can't get preview_url as
    // of the Nov 2024 policy change) — see lib/previewLookup.js for why.
    // A failed/empty lookup is a normal outcome, not an error: the fan
    // page just renders without a snippet button in that case.
    let preview_url = null;
    let preview_source = null;
    try {
      const preview = await findPreviewUrl({ artist_name, track_title });
      if (preview) {
        preview_url = preview.preview_url;
        preview_source = preview.preview_source;
      }
    } catch (err) {
      console.error("[/api/links/create] preview lookup failed (non-fatal):", err);
    }

    const smartlink = await prisma.smartLink.create({
      data: {
        slug,
        user_id: user.id,
        artist_name,
        track_title,
        release_date,
        artwork_url,
        artwork_urls: gallery.length > 0 ? gallery.join(",") : null,
        is_presave,
        ...platformUrls,
        community_url,
        community_label,
        booking_url,
        booking_label,
        pixel_fb,
        pixel_tiktok,
        preview_url,
        preview_source,
      },
    });

    return res.status(201).json({
      smartlink,
      tier: user.is_pro ? "premium" : "trial",
      dropped_fields: droppedFields,
      share_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/${smartlink.slug}`,
    });
  } catch (err) {
    console.error("[/api/links/create] error:", err);
    return res.status(500).json({ error: "Internal server error while creating SmartLink." });
  }
}
