// Looks up a short, royalty-clear audio preview clip for a track so fans
// can hear a 5-second snippet on the SmartLink page before deciding to
// stream/pre-save. We deliberately do NOT use Spotify's Web API for this:
// as of Nov 27, 2024 Spotify restricts `preview_url` on newly registered
// developer apps (see developer.spotify.com/blog/2024-11-27-changes-to-the-web-api),
// so a brand-new app like ours cannot reliably get one from Spotify.
//
// Instead we use two free, unauthenticated, long-stable public APIs, in
// order:
//   1. Apple's iTunes Search API  — no key required, returns `previewUrl`
//      (an .m4a clip) for a huge catalog.
//   2. Deezer's public Search API — no key required, returns `preview`
//      (a 30-second .mp3 clip).
//
// Both are best-effort: if a track can't be found (e.g. an unreleased
// pre-save, an obscure regional release), we simply return null and the
// SmartLink page shows no preview button rather than a broken one.

const LOOKUP_TIMEOUT_MS = 4000;

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function lookupItunes(artist_name, track_title) {
  const term = encodeURIComponent(`${artist_name} ${track_title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`;
  const data = await fetchWithTimeout(url, LOOKUP_TIMEOUT_MS);
  const result = data?.results?.[0];
  if (result?.previewUrl) {
    return { preview_url: result.previewUrl, preview_source: "apple_music" };
  }
  return null;
}

async function lookupDeezer(artist_name, track_title) {
  const q = encodeURIComponent(`${artist_name} ${track_title}`);
  const url = `https://api.deezer.com/search?q=${q}&limit=1`;
  const data = await fetchWithTimeout(url, LOOKUP_TIMEOUT_MS);
  const result = data?.data?.[0];
  if (result?.preview) {
    return { preview_url: result.preview, preview_source: "deezer" };
  }
  return null;
}

// Returns { preview_url, preview_source } or null. Never throws — every
// failure mode (network error, timeout, no match) just means "no preview",
// which is a fully supported, expected state for a SmartLink.
export async function findPreviewUrl({ artist_name, track_title }) {
  if (!artist_name || !track_title) return null;

  try {
    const apple = await lookupItunes(artist_name, track_title);
    if (apple) return apple;
  } catch (err) {
    // fall through to next source
  }

  try {
    const deezer = await lookupDeezer(artist_name, track_title);
    if (deezer) return deezer;
  } catch (err) {
    // fall through
  }

  return null;
}
