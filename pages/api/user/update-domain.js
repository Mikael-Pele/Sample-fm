import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";
import { CUSTOM_DOMAINS_ENABLED } from "../../../lib/plans";

// Custom domains are a paid feature that isn't finished yet (DNS setup still
// needs the site owner's Vercel project), so it's switched off for everyone
// and shown as "coming soon" in the dashboard. Requests are rejected
// outright — never silently stored, never partially applied.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    if (!CUSTOM_DOMAINS_ENABLED) {
      return res.status(403).json({ error: "Custom domains are coming soon." });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });

    if (!user) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    if (!user.is_pro) {
      return res.status(403).json({
        error: "Custom domains are a paid feature. Subscribe to unlock this field.",
      });
    }

    const { custom_domain } = req.body || {};

    if (typeof custom_domain !== "string" || custom_domain.trim().length === 0) {
      return res.status(400).json({ error: "custom_domain must be a non-empty string." });
    }

    const domainPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
    const trimmedDomain = custom_domain.trim().toLowerCase();

    if (!domainPattern.test(trimmedDomain)) {
      return res.status(400).json({ error: "Please provide a valid domain, e.g. links.myartistbrand.com" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { custom_domain: trimmedDomain },
    });

    return res.status(200).json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        is_pro: updatedUser.is_pro,
        custom_domain: updatedUser.custom_domain,
      },
    });
  } catch (err) {
    console.error("[/api/user/update-domain] error:", err);
    return res.status(500).json({ error: "Internal server error while updating custom domain." });
  }
}
