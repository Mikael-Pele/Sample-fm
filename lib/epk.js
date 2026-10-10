import { cleanText } from "./fieldClean";
import { normalizeBookingContact, SLUG_PATTERN } from "./linkValidation";
import { EPK_SECTIONS, MAX_PRESS_QUOTES } from "./epkSections";

export { EPK_SECTIONS, MAX_PRESS_QUOTES } from "./epkSections";

// Platform columns on smartlinks, in the order the SmartLink form shows them.
const PLATFORM_COLUMNS = [
  ["url_audiomack", "Audiomack"],
  ["url_boomplay", "Boomplay"],
  ["url_spotify", "Spotify"],
  ["url_apple", "Apple Music"],
  ["url_youtube", "YouTube Music"],
  ["url_deezer", "Deezer"],
  ["url_tidal", "Tidal"],
  ["url_soundcloud", "SoundCloud"],
  ["url_pandora", "Pandora"],
  ["url_iheartradio", "iHeartRadio"],
  ["url_tiktok", "TikTok"],
];

export function resolveVisibility(stored) {
  const raw = stored && typeof stored === "object" ? stored : {};
  return Object.fromEntries(EPK_SECTIONS.map((s) => [s.key, raw[s.key] !== false]));
}

// The numbers Droppa can vouch for, computed live from the artist's own
// data rather than stored, so they can't be edited.
export async function computeVerifiedStats(prisma, userId) {
  const [clicks, releases, links] = await Promise.all([
    prisma.analytics.count({ where: { link: { user_id: userId } } }),
    prisma.release.count({ where: { user_id: userId, status: { not: "draft" } } }),
    prisma.smartLink.findMany({
      where: { user_id: userId },
      select: Object.fromEntries(PLATFORM_COLUMNS.map(([col]) => [col, true])),
    }),
  ]);
  const platforms = PLATFORM_COLUMNS.filter(([col]) => links.some((l) => l[col])).map(([, label]) => label);
  return { clicks, releases, platforms };
}

export function defaultHandle(user, firstLinkSlug) {
  const base = (firstLinkSlug || (user.email || "").split("@")[0] || "artist")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "artist";
}

export function validateEpk(body) {
  const payload = body || {};

  const handle = (cleanText(payload.handle, 40) || "").toLowerCase();
  if (!handle || !SLUG_PATTERN.test(handle)) {
    return { error: "Your EPK link can only use lowercase letters, numbers and single hyphens." };
  }

  let monthly_streams = null;
  if (payload.monthly_streams !== null && payload.monthly_streams !== undefined && payload.monthly_streams !== "") {
    const n = Number(String(payload.monthly_streams).replace(/[,\s]/g, ""));
    if (!Number.isInteger(n) || n < 0 || n > 2000000000) {
      return { error: "Monthly streams must be a whole number." };
    }
    monthly_streams = n;
  }

  const booking_contact = normalizeBookingContact(payload.booking_contact);
  if (booking_contact === false) {
    return { error: "Booking contact must be an email address or a link starting with https://." };
  }

  const photo_url = cleanText(payload.photo_url, 600);
  if (photo_url && !/^https:\/\//i.test(photo_url)) {
    return { error: "Photo must be an uploaded image or an https:// link." };
  }

  const press_quotes = (Array.isArray(payload.press_quotes) ? payload.press_quotes : [])
    .map((q) => ({ quote: cleanText(q && q.quote, 400), source: cleanText(q && q.source, 80) }))
    .filter((q) => q.quote)
    .slice(0, MAX_PRESS_QUOTES);

  return {
    data: {
      handle,
      display_name: cleanText(payload.display_name, 80),
      bio: cleanText(payload.bio, 2000),
      photo_url,
      monthly_streams,
      booking_contact,
      press_quotes,
      visibility: resolveVisibility(payload.visibility),
      published: Boolean(payload.published),
    },
  };
}

export function serializeEpk(profile) {
  return {
    handle: profile.handle,
    display_name: profile.display_name,
    bio: profile.bio,
    photo_url: profile.photo_url,
    monthly_streams: profile.monthly_streams,
    booking_contact: profile.booking_contact,
    press_quotes: Array.isArray(profile.press_quotes) ? profile.press_quotes : [],
    visibility: resolveVisibility(profile.visibility),
    published: Boolean(profile.published),
  };
}
