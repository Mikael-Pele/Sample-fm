import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";
import { generateSlug } from "../../../lib/slug";

// Fields that are always allowed, regardless of tier.
const BASE_ALLOWED_FIELDS = [
  "artist_name",
  "track_title",
  "release_date",
  "artwork_url",
  "is_presave",
  "url_audiomack",
  "url_boomplay",
  "url_spotify",
  "url_apple",
  "url_youtube",
  "url_whatsapp",
  "community_url",
  "community_label",
];

// Fields that are gated behind the Premium ($16/mo) tier. If a free-tier
// user submits any of these, they are silently sanitized and dropped —
// never persisted, never partially honored.
const PRO_ONLY_FIELDS = ["pixel_fb", "pixel_tiktok", "custom_domain"];

function sanitizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidUrl(value) {
  if (!value) return true; // optional fields
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch (err) {
    return false;
  }
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set([
  "api",
  "dashboard",
  "login",
  "register",
  "logout",
  "admin",
  "_next",
  "favicon.ico",
]);

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

    const user = await prisma.user.findUnique({ where: { id: session.userId } });

    if (!user) {
      return res.status(401).json({ error: "You must be signed in to create a SmartLink." });
    }

    const payload = req.body || {};

    // ---- Required field validation -------------------------------------
    const artist_name = sanitizeString(payload.artist_name);
    const track_title = sanitizeString(payload.track_title);
    const release_date_raw = payload.release_date;

    // Cover art may arrive as a gallery of multiple image URLs. The first
    // entry (or the one explicitly marked primary via artwork_url) becomes
    // the banner image rendered on the fan page; the full set is stored so
    // the dashboard can show the gallery back to the creator.
    const rawGallery = Array.isArray(payload.artwork_urls)
      ? payload.artwork_urls
      : typeof payload.artwork_urls === "string"
      ? payload.artwork_urls.split(",")
      : [];
    const gallery = rawGallery.map((u) => sanitizeString(u)).filter(Boolean);

    const artwork_url = sanitizeString(payload.artwork_url) || gallery[0] || null;

    if (!artist_name || !track_title || !artwork_url || !release_date_raw) {
      return res.status(400).json({
        error: "artist_name, track_title, at least one cover image, and release_date are required.",
      });
    }

    const release_date = new Date(release_date_raw);
    if (Number.isNaN(release_date.getTime())) {
      return res.status(400).json({ error: "release_date must be a valid date." });
    }

    if (!isValidUrl(artwork_url)) {
      return res.status(400).json({ error: "artwork_url must be a valid URL." });
    }

    for (const url of gallery) {
      if (!isValidUrl(url)) {
        return res.status(400).json({ error: "One of the cover image URLs is not valid." });
      }
    }

    const platformUrls = {
      url_audiomack: sanitizeString(payload.url_audiomack),
      url_boomplay: sanitizeString(payload.url_boomplay),
      url_spotify: sanitizeString(payload.url_spotify),
      url_apple: sanitizeString(payload.url_apple),
      url_youtube: sanitizeString(payload.url_youtube),
      url_deezer: sanitizeString(payload.url_deezer),
      url_tidal: sanitizeString(payload.url_tidal),
      url_soundcloud: sanitizeString(payload.url_soundcloud),
      url_pandora: sanitizeString(payload.url_pandora),
      url_iheartradio: sanitizeString(payload.url_iheartradio),
      url_whatsapp: sanitizeString(payload.url_whatsapp),
    };

    for (const [key, value] of Object.entries(platformUrls)) {
      if (!isValidUrl(value)) {
        return res.status(400).json({ error: `${key} must be a valid URL.` });
      }
    }

    // ---- Fan community CTA (optional, free tier) ------------------------
    // A single artist-branded call to action ("Join the Nation") pointing
    // wherever their real community lives — not tier-gated, since it's a
    // growth lever every creator should be able to use from day one.
    const community_url = sanitizeString(payload.community_url);
    const community_label = sanitizeString(payload.community_label);

    if (!isValidUrl(community_url)) {
      return res.status(400).json({ error: "community_url must be a valid URL." });
    }
    if (community_label && community_label.length > 40) {
      return res.status(400).json({ error: "Community CTA label must be 40 characters or fewer." });
    }

    const is_presave = Boolean(payload.is_presave) || release_date.getTime() > Date.now();

    // ---- 2-Tier Monetization Enforcement --------------------------------
    // Free tier (is_pro === false): tracking pixels and custom domains are
    // stripped out entirely before the record is ever built — the values
    // never reach the database, and no partial/soft-locked version is
    // persisted either.
    //
    // Premium tier (is_pro === true): the full payload, including pixel IDs,
    // is allowed through untouched.
    let pixel_fb = null;
    let pixel_tiktok = null;
    const droppedFields = [];

    if (user.is_pro) {
      pixel_fb = sanitizeString(payload.pixel_fb);
      pixel_tiktok = sanitizeString(payload.pixel_tiktok);
    } else {
      for (const field of PRO_ONLY_FIELDS) {
        if (payload[field] !== undefined && payload[field] !== null && payload[field] !== "") {
          droppedFields.push(field);
        }
      }
    }

    // ---- Custom vanity slug (optional) ----------------------------------
    // e.g. sample.fm/catch-the-feeling instead of a random string. Falls
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
        pixel_fb,
        pixel_tiktok,
      },
    });

    return res.status(201).json({
      smartlink,
      tier: user.is_pro ? "premium" : "free",
      dropped_fields: droppedFields,
      share_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/${smartlink.slug}`,
    });
  } catch (err) {
    console.error("[/api/links/create] error:", err);
    return res.status(500).json({ error: "Internal server error while creating SmartLink." });
  }
}
