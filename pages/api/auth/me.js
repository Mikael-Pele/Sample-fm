import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        is_pro: user.is_pro,
        email_verified: user.email_verified,
        custom_domain: user.custom_domain,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("[/api/auth/me] error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
