import prisma from "../../../lib/prisma";
import { isValidEmail } from "../../../lib/auth";

// Captures a fan's email for an unreleased (pre-save) track and queues it
// in the `presaves` table. A separate release-day worker/cron is expected
// to sweep `processed: false` rows and fire the actual DSP pre-save API
// calls (Spotify, Apple Music, etc.) at midnight on release_date.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { link_id, slug, fan_email, provider } = req.body || {};

    if ((!link_id && !slug) || !fan_email || !provider) {
      return res.status(400).json({
        error: "link_id (or slug), fan_email, and provider are required.",
      });
    }

    if (!isValidEmail(fan_email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    const smartlink = await prisma.smartLink.findFirst({
      where: link_id ? { id: link_id } : { slug },
    });

    if (!smartlink) {
      return res.status(404).json({ error: "SmartLink not found." });
    }

    if (!smartlink.is_presave && smartlink.release_date.getTime() <= Date.now()) {
      return res.status(400).json({
        error: "This track has already been released and is not accepting pre-saves.",
      });
    }

    const presave = await prisma.presave.create({
      data: {
        link_id: smartlink.id,
        fan_email: fan_email.trim().toLowerCase(),
        provider,
        processed: false,
      },
    });

    return res.status(201).json({ presave });
  } catch (err) {
    console.error("[/api/presave/register] error:", err);
    return res.status(500).json({ error: "Internal server error while registering pre-save." });
  }
}
