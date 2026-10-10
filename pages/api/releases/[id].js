import prisma from "../../../lib/prisma";
import { loadDashboardUser } from "../../../lib/dashboardApi";
import { validateRelease, serializeRelease } from "../../../lib/releases";

// PUT edits one of the artist's releases; DELETE removes it.
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
    const existing = typeof id === "string" ? await prisma.release.findUnique({ where: { id } }) : null;
    if (!existing || existing.user_id !== user.id) {
      return res.status(404).json({ error: "Release not found." });
    }

    if (req.method === "DELETE") {
      await prisma.release.delete({ where: { id } });
      return res.status(200).json({ deleted: true, id });
    }

    const { error, data } = validateRelease(req.body);
    if (error) return res.status(400).json({ error });

    const release = await prisma.release.update({ where: { id }, data });
    return res.status(200).json({ release: serializeRelease(release) });
  } catch (err) {
    console.error("[/api/releases/[id]] error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
