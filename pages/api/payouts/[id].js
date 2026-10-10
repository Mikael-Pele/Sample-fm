import prisma from "../../../lib/prisma";
import { loadDashboardUser } from "../../../lib/dashboardApi";
import { validatePayout, serializePayout } from "../../../lib/payouts";

// PUT edits one of the artist's payouts; DELETE removes it.
export default async function handler(req, res) {
  if (req.method !== "PUT" && req.method !== "DELETE") {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Deleting is allowed after a trial ends, same as SmartLinks.
    const user = await loadDashboardUser(req, res, { write: req.method === "PUT" });
    if (!user) return;

    const { id } = req.query;
    const existing = typeof id === "string" ? await prisma.payout.findUnique({ where: { id } }) : null;
    if (!existing || existing.user_id !== user.id) {
      return res.status(404).json({ error: "Payout not found." });
    }

    if (req.method === "DELETE") {
      await prisma.payout.delete({ where: { id } });
      return res.status(200).json({ deleted: true, id });
    }

    const { error, data } = validatePayout(req.body);
    if (error) return res.status(400).json({ error });

    const payout = await prisma.payout.update({ where: { id }, data });
    return res.status(200).json({ payout: serializePayout(payout) });
  } catch (err) {
    console.error("[/api/payouts/[id]] error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
