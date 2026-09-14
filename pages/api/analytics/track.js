import prisma from "../../../lib/prisma";
import { extractCountryFromHeaders, detectDeviceType } from "../../../lib/geo";

const VALID_PLATFORMS = new Set([
  "audiomack",
  "boomplay",
  "spotify",
  "apple",
  "youtube",
  "deezer",
  "tidal",
  "soundcloud",
  "pandora",
  "iheartradio",
  "whatsapp",
  "community_cta",
  "presave",
  "footer_cta",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { link_id, slug, platform_clicked, simulated_country } = req.body || {};

    if ((!link_id && !slug) || !platform_clicked) {
      return res.status(400).json({
        error: "link_id (or slug) and platform_clicked are required.",
      });
    }

    if (!VALID_PLATFORMS.has(platform_clicked)) {
      return res.status(400).json({ error: "Unrecognized platform_clicked value." });
    }

    const smartlink = await prisma.smartLink.findFirst({
      where: link_id ? { id: link_id } : { slug },
    });

    if (!smartlink) {
      return res.status(404).json({ error: "SmartLink not found." });
    }

    // Fan country is extracted from edge/proxy geo headers when available.
    // In local development, or when the fan-facing page explicitly passes
    // a simulated_country (used for the geo-targeting demo), we fall back
    // to that value.
    const headerCountry = extractCountryFromHeaders(req.headers);
    const fan_country =
      headerCountry && headerCountry !== "UNKNOWN"
        ? headerCountry
        : simulated_country || "UNKNOWN";

    const device_type = detectDeviceType(req.headers["user-agent"]);

    const event = await prisma.analytics.create({
      data: {
        link_id: smartlink.id,
        platform_clicked,
        fan_country,
        device_type,
      },
    });

    return res.status(201).json({ event });
  } catch (err) {
    console.error("[/api/analytics/track] error:", err);
    return res.status(500).json({ error: "Internal server error while tracking click." });
  }
}
