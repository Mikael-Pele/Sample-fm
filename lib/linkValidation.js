// Shared field validation/sanitization for SmartLink create AND edit, so
// the two endpoints can never silently drift apart on what counts as a
// valid link (e.g. one accepting a bad URL the other would reject).

export const PRO_ONLY_FIELDS = ["pixel_fb", "pixel_tiktok", "custom_domain"];

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const RESERVED_SLUGS = new Set([
  "api",
  "dashboard",
  "login",
  "register",
  "logout",
  "admin",
  "_next",
  "favicon.ico",
]);

export function sanitizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidUrl(value) {
  if (!value) return true; // optional fields
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch (err) {
    return false;
  }
}

// Validates and sanitizes every field a creator can set on a SmartLink,
// except slug (handled separately by each caller, since "leave blank"
// means different things on create vs. edit) and the pro-only pixel
// fields (handled separately since they depend on the caller's plan).
// Returns { error: "..." } on the first validation failure, or the clean
// fields on success.
export function validateCoreFields(payload) {
  const artist_name = sanitizeString(payload.artist_name);
  const track_title = sanitizeString(payload.track_title);
  const release_date_raw = payload.release_date;

  const rawGallery = Array.isArray(payload.artwork_urls)
    ? payload.artwork_urls
    : typeof payload.artwork_urls === "string"
    ? payload.artwork_urls.split(",")
    : [];
  const gallery = rawGallery.map((u) => sanitizeString(u)).filter(Boolean);

  const artwork_url = sanitizeString(payload.artwork_url) || gallery[0] || null;

  if (!artist_name || !track_title || !artwork_url || !release_date_raw) {
    return {
      error: "artist_name, track_title, at least one cover image, and release_date are required.",
    };
  }

  const release_date = new Date(release_date_raw);
  if (Number.isNaN(release_date.getTime())) {
    return { error: "release_date must be a valid date." };
  }

  if (!isValidUrl(artwork_url)) {
    return { error: "artwork_url must be a valid URL." };
  }

  for (const url of gallery) {
    if (!isValidUrl(url)) {
      return { error: "One of the cover image URLs is not valid." };
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
      return { error: `${key} must be a valid URL.` };
    }
  }

  const community_url = sanitizeString(payload.community_url);
  const community_label = sanitizeString(payload.community_label);

  if (!isValidUrl(community_url)) {
    return { error: "community_url must be a valid URL." };
  }
  if (community_label && community_label.length > 40) {
    return { error: "Community CTA label must be 40 characters or fewer." };
  }

  const is_presave = Boolean(payload.is_presave) || release_date.getTime() > Date.now();

  return {
    artist_name,
    track_title,
    release_date,
    artwork_url,
    gallery,
    platformUrls,
    community_url,
    community_label,
    is_presave,
  };
}

// Applies the 2-tier monetization rule: free-tier users never get pixel
// values persisted, even partially — and we report back which fields got
// silently dropped so the UI can tell the creator why.
export function resolveProOnlyFields(payload, isPro) {
  if (isPro) {
    return {
      pixel_fb: sanitizeString(payload.pixel_fb),
      pixel_tiktok: sanitizeString(payload.pixel_tiktok),
      droppedFields: [],
    };
  }

  const droppedFields = [];
  for (const field of PRO_ONLY_FIELDS) {
    if (payload[field] !== undefined && payload[field] !== null && payload[field] !== "") {
      droppedFields.push(field);
    }
  }
  return { pixel_fb: null, pixel_tiktok: null, droppedFields };
}
