import prisma from "../../../lib/prisma";
import { loadDashboardUser } from "../../../lib/dashboardApi";
import { computeVerifiedStats, defaultHandle, serializeEpk, validateEpk, resolveVisibility } from "../../../lib/epk";

// GET returns the artist's EPK (or a starting draft if they haven't saved
// one) plus the Droppa-verified stats; PUT saves it.
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await loadDashboardUser(req, res, { write: req.method === "PUT" });
    if (!user) return;

    if (req.method === "GET") {
      const [profile, stats, firstLink] = await Promise.all([
        prisma.epkProfile.findUnique({ where: { user_id: user.id } }),
        computeVerifiedStats(prisma, user.id),
        prisma.smartLink.findFirst({
          where: { user_id: user.id },
          orderBy: { created_at: "asc" },
          select: { slug: true, artist_name: true },
        }),
      ]);

      const epk = profile
        ? serializeEpk(profile)
        : {
            handle: defaultHandle(user, firstLink && firstLink.slug),
            display_name: firstLink ? firstLink.artist_name : null,
            bio: null,
            photo_url: null,
            monthly_streams: null,
            booking_contact: null,
            press_quotes: [],
            visibility: resolveVisibility({}),
            published: false,
          };

      return res.status(200).json({ epk, saved: Boolean(profile), stats });
    }

    const { error, data } = validateEpk(req.body);
    if (error) return res.status(400).json({ error });

    const taken = await prisma.epkProfile.findUnique({ where: { handle: data.handle }, select: { user_id: true } });
    if (taken && taken.user_id !== user.id) {
      return res.status(409).json({ error: `droppa.fm/epk/${data.handle} is already taken. Try another.` });
    }

    const profile = await prisma.epkProfile.upsert({
      where: { user_id: user.id },
      create: { ...data, user_id: user.id },
      update: data,
    });

    return res.status(200).json({ epk: serializeEpk(profile), saved: true });
  } catch (err) {
    console.error("[/api/epk] error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
