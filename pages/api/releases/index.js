import prisma from "../../../lib/prisma";
import { loadDashboardUser } from "../../../lib/dashboardApi";
import { validateRelease, serializeRelease } from "../../../lib/releases";

// GET lists the signed-in artist's releases; POST adds one.
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await loadDashboardUser(req, res, { write: req.method === "POST" });
    if (!user) return;

    if (req.method === "GET") {
      const releases = await prisma.release.findMany({
        where: { user_id: user.id },
        orderBy: [{ release_date: { sort: "desc", nulls: "first" } }, { created_at: "desc" }],
      });
      return res.status(200).json({ releases: releases.map(serializeRelease) });
    }

    const { error, data } = validateRelease(req.body);
    if (error) return res.status(400).json({ error });

    const release = await prisma.release.create({ data: { ...data, user_id: user.id } });
    return res.status(201).json({ release: serializeRelease(release) });
  } catch (err) {
    console.error("[/api/releases] error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
