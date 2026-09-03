// Extracts the fan's country from standard edge/proxy headers.
// Vercel's edge network sets `x-vercel-ip-country`. Cloudflare sets
// `cf-ipcountry`. We fall back through a chain of common headers so the
// platform works correctly regardless of hosting provider.
export function extractCountryFromHeaders(headers) {
  const candidates = [
    headers["x-vercel-ip-country"],
    headers["cf-ipcountry"],
    headers["x-country-code"],
    headers["x-geo-country"],
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim().toUpperCase();
    }
  }

  return "UNKNOWN";
}

// ISO-3166 alpha-2 codes for the primary African markets Droppa.fm targets.
// Used to decide whether Audiomack / Boomplay should be prioritized above
// Spotify / Apple Music on the fan-facing landing page.
export const AFRICAN_COUNTRY_CODES = new Set([
  "NG", // Nigeria
  "GH", // Ghana
  "KE", // Kenya
  "ZA", // South Africa
  "TZ", // Tanzania
  "UG", // Uganda
  "CI", // Cote d'Ivoire
  "SN", // Senegal
  "CM", // Cameroon
  "EG", // Egypt
  "ET", // Ethiopia
  "RW", // Rwanda
  "ZM", // Zambia
  "ZW", // Zimbabwe
  "MZ", // Mozambique
  "AO", // Angola
  "DZ", // Algeria
  "MA", // Morocco
  "TN", // Tunisia
  "BJ", // Benin
  "TG", // Togo
  "ML", // Mali
  "BF", // Burkina Faso
  "GM", // Gambia
  "SL", // Sierra Leone
  "LR", // Liberia
  "NA", // Namibia
  "BW", // Botswana
  "MW", // Malawi
]);

export function isAfricanCountry(countryCode) {
  if (!countryCode) return false;
  return AFRICAN_COUNTRY_CODES.has(countryCode.toUpperCase());
}

// Friendly display names for the demo/simulation dropdown used on the
// fan-facing landing page when no real geo header is present (localhost).
export const COUNTRY_DISPLAY_NAMES = {
  NG: "Nigeria",
  GH: "Ghana",
  KE: "Kenya",
  ZA: "South Africa",
  US: "United States",
  GB: "United Kingdom",
  UNKNOWN: "Unknown",
};

export function detectDeviceType(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return "desktop";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile/.test(ua)) return "mobile";
  return "desktop";
}
