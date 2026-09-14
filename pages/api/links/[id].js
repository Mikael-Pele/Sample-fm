import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";
import { ensurePlanCurrent } from "../../../lib/plans";
import { findPreviewUrl } from "../../../lib/previewLookup";
import {
  validateCoreFields,
  resolveProOnlyFields,
  sanitizeString,
  SLUG_PATTERN,
  RESERVED_SLUGS,
} from "../../../lib/linkValidation";

// GET is intentionally not implemented here — the dashboard fetches the
// full list via /api/links/list. This route handles single-record
// actions: DELETE (destructive) and PUT (edit in place).
export default async function handler(req, res) {
  if (req.method === "DELETE") {
    return handleDelete(req, res);
  }
  if (req.method === "PUT") {
    return handleUpdate(req, res);
  }
  res.setHeader("Allow", ["DELETE", "PUT"]);
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleDelete(req, res) {
  try {
    const session = getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "A SmartLink id is required." });
    }

    const smartlink = await prisma.smartLink.findUnique({ where: { id } });

    if (!smartlink) {
      return res.status(404).json({ error: "SmartLink not found." });
    }

    if (smartlink.user_id !== session.userId) {
      // Don't leak whether the link exists to a non-owner.
      return res.status(404).json({ error: "SmartLink not found." });
    }

    // Delete child records first — we manage the schema by hand in
    // production (no `prisma migrate`), so we can't assume the live DB
    // actually has ON DELETE CASCADE foreign keys wired up yet, even
    // though the Prisma schema declares them.
    await prisma.$transaction([
      prisma.analytics.deleteMany({ where: { link_id: id } }),
      prisma.presave.deleteMany({ where: { link_id: id } }),
      prisma.smartLink.delete({ where: { id } }),
    ]);

    return res.status(200).json({ deleted: true, id });
  } catch (err) {
    console.error("[/api/links/[id]] delete error:", err);
    return res.status(500).json({ error: "Internal server error while deleting SmartLink." });
  }
}

async function handleUpdate(req, res) {
  try {
    const session = getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "A SmartLink id is required." });
    }

    let user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return res.status(401).json({ error: "You must be signed in." });
    }
    user = await ensurePlanCurrent(prisma, user);

    const existing = await prisma.smartLink.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "SmartLink not found." });
    }
    if (existing.user_id !== session.userId) {
      // Don't leak whether the link exists to a non-owner.
      return res.status(404).json({ error: "SmartLink not found." });
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
      is_presave,
    } = core;

    const { pixel_fb, pixel_tiktok, droppedFields } = resolveProOnlyFields(payload, user.is_pro);

    // ---- Custom vanity slug ------------------------------------------
    // Unlike creation, leaving this blank on an edit means "don't touch
    // the slug" — we never auto-swap a link's slug out from under a
    // creator who's already shared it. Only an explicit, different value
    // triggers the same validation + uniqueness checks as creation.
    const requestedSlug = sanitizeString(payload.custom_slug);
    let slug = existing.slug;

    if (requestedSlug) {
      const normalizedSlug = requestedSlug.toLowerCase();

      if (normalizedSlug !== existing.slug) {
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

        const clash = await prisma.smartLink.findUnique({ where: { slug: normalizedSlug } });
        if (clash && clash.id !== id) {
          return res.status(409).json({ error: "That custom link is already taken." });
        }

        slug = normalizedSlug;
      }
    }

    // ---- 5-second audio preview ---------------------------------------
    // Always re-run on edit (not just when artist/title changed) — this
    // deliberately doubles as the "retry" mechanism for a link whose
    // preview lookup came back empty the first time (e.g. the track
    // wasn't indexed yet, or a transient network hiccup). Best-effort,
    // never blocks the save.
    let preview_url = existing.preview_url;
    let preview_source = existing.preview_source;
    try {
      const preview = await findPreviewUrl({ artist_name, track_title });
      if (preview) {
        preview_url = preview.preview_url;
        preview_source = preview.preview_source;
      } else {
        preview_url = null;
        preview_source = null;
      }
    } catch (err) {
      console.error("[/api/links/[id]] preview lookup failed (non-fatal):", err);
    }

    const smartlink = await prisma.smartLink.update({
      where: { id },
      data: {
        slug,
        artist_name,
        track_title,
        release_date,
        artwork_url,
        artwork_urls: gallery.length > 0 ? gallery.join(",") : null,
        is_presave,
        ...platformUrls,
        community_url,
        community_label,
        pixel_fb,
        pixel_tiktok,
        preview_url,
        preview_source,
      },
    });

    return res.status(200).json({
      smartlink,
      tier: user.is_pro ? "premium" : "free",
      dropped_fields: droppedFields,
      share_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/${smartlink.slug}`,
    });
  } catch (err) {
    console.error("[/api/links/[id]] update error:", err);
    return res.status(500).json({ error: "Internal server error while updating SmartLink." });
  }
}
