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
    const artwork_url = sanitizeString(payload.artwork_url);
    const release_date_raw = payload.release_date;

    if (!artist_name || !track_title || !artwork_url || !release_date_raw) {
      return res.status(400).json({
        error: "artist_name, track_title, artwork_url, and release_date are required.",
      });
    }

    const release_date = new Date(release_date_raw);
    if (Number.isNaN(release_date.getTime())) {
      return res.status(400).json({ error: "release_date must be a valid date." });
    }

    if (!isValidUrl(artwork_url)) {
      return res.status(400).json({ error: "artwork_url must be a valid URL." });
    }

    const platformUrls = {
      url_audiomack: sanitizeString(payload.url_audiomack),
      url_boomplay: sanitizeString(payload.url_boomplay),
      url_spotify: sanitizeString(payload.url_spotify),
      url_apple: sanitizeString(payload.url_apple),
      url_youtube: sanitizeString(payload.url_youtube),
    };

    for (const [key, value] of Object.entries(platformUrls)) {
      if (!isValidUrl(value)) {
        return res.status(400).json({ error: `${key} must be a valid URL.` });
      }
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

    const slug = generateSlug(7);

    const smartlink = await prisma.smartlink.create({
      data: {
        slug,
        user_id: user.id,
        artist_name,
        track_title,
        release_date,
        artwork_url,
        is_presave,
        ...platformUrls,
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
