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
      return res.status(401).json({ error: "You must be signed in." });
    }

    const smartlinks = await prisma.smartLink.findMany({
      where: { user_id: session.userId },
      orderBy: { created_at: "desc" },
      include: {
        _count: {
          select: { analytics: true, presaves: true },
        },
      },
    });

    return res.status(200).json({ smartlinks });
  } catch (err) {
    console.error("[/api/links/list] error:", err);
    return res.status(500).json({ error: "Internal server error while listing SmartLinks." });
  }
}
