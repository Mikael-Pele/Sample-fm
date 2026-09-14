import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";

// GET is intentionally not implemented here — the dashboard fetches the
// full list via /api/links/list. This route only handles destructive
// single-record actions (currently: DELETE).
export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "A SmartLink id is required." });
    }

    const smartlink = await prisma.smartLink.findUnique({ where: { id } });

    if (!smartlink) {
      return res.status(404).json({ error: "SmartLink not found." });
    }

    if (smartlink.user_id !== session.userId) {
      // Don't leak whether the link exists to a non-owner.
      return res.status(404).json({ error: "SmartLink not found." });
    }

    // Delete child records first — we manage the schema by hand in
    // production (no `prisma migrate`), so we can't assume the live DB
    // actually has ON DELETE CASCADE foreign keys wired up yet, even
    // though the Prisma schema declares them.
    await prisma.$transaction([
      prisma.analytics.deleteMany({ where: { link_id: id } }),
      prisma.presave.deleteMany({ where: { link_id: id } }),
      prisma.smartLink.delete({ where: { id } }),
    ]);

    return res.status(200).json({ deleted: true, id });
  } catch (err) {
    console.error("[/api/links/[id]] error:", err);
    return res.status(500).json({ error: "Internal server error while deleting SmartLink." });
  }
}
