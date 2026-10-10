import prisma from "../../../lib/prisma";
import { loadDashboardUser } from "../../../lib/dashboardApi";
import { validatePayout, serializePayout } from "../../../lib/payouts";

// GET lists the signed-in artist's logged payments; POST logs one.
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await loadDashboardUser(req, res, { write: req.method === "POST" });
    if (!user) return;

    if (req.method === "GET") {
      const payouts = await prisma.payout.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
      });
      return res.status(200).json({ payouts: payouts.map(serializePayout) });
    }

    const { error, data } = validatePayout(req.body);
    if (error) return res.status(400).json({ error });

    const payout = await prisma.payout.create({ data: { ...data, user_id: user.id } });
    return res.status(201).json({ payout: serializePayout(payout) });
  } catch (err) {
    console.error("[/api/payouts] error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
