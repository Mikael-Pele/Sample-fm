import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";

// Aggregates click + pre-save data across every SmartLink owned by the
// signed-in creator, for the Dashboard's Analytics Panel:
//   - Total Clicks
//   - Top Platform
//   - Top Country
//   - Fan emails collected via Pre-Saves (PREMIUM ONLY — see tier gate below)
//
// SECURITY: raw fan_email values are a paid data asset. Free-tier accounts
// may see that pre-saves are being collected (a count), but the actual
// email strings are never included in the JSON response — this is
// enforced here, server-side, not just hidden in the UI. A free-tier user
// inspecting network traffic cannot recover the email list.
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

    const user = await prisma.user.findUnique({ where: { id: session.userId } });

    if (!user) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    const userLinks = await prisma.smartLink.findMany({
      where: { user_id: user.id },
      select: { id: true },
    });

    const linkIds = userLinks.map((l) => l.id);

    if (linkIds.length === 0) {
      return res.status(200).json({
        total_clicks: 0,
        top_platform: null,
        top_country: null,
        presave_count: 0,
        presaves: [],
        presaves_locked: !user.is_pro,
        platform_breakdown: [],
        country_breakdown: [],
      });
    }

    const [totalClicks, platformGroups, countryGroups, presaveCount, rawPresaves] =
      await Promise.all([
        prisma.analytics.count({ where: { link_id: { in: linkIds } } }),
        prisma.analytics.groupBy({
          by: ["platform_clicked"],
          where: { link_id: { in: linkIds } },
          _count: { platform_clicked: true },
          orderBy: { _count: { platform_clicked: "desc" } },
        }),
        prisma.analytics.groupBy({
          by: ["fan_country"],
          where: { link_id: { in: linkIds } },
          _count: { fan_country: true },
          orderBy: { _count: { fan_country: "desc" } },
        }),
        prisma.presave.count({ where: { link_id: { in: linkIds } } }),
        // Only ever fetch the raw rows (including fan_email) when the
        // account is confirmed Premium server-side.
        user.is_pro
          ? prisma.presave.findMany({
              where: { link_id: { in: linkIds } },
              orderBy: { created_at: "desc" },
              include: {
                link: { select: { artist_name: true, track_title: true, slug: true } },
              },
            })
          : Promise.resolve([]),
      ]);

    const platform_breakdown = platformGroups.map((g) => ({
      platform: g.platform_clicked,
      count: g._count.platform_clicked,
    }));

    const country_breakdown = countryGroups.map((g) => ({
      country: g.fan_country || "UNKNOWN",
      count: g._count.fan_country,
    }));

    const top_platform = platform_breakdown.length > 0 ? platform_breakdown[0].platform : null;
    const top_country = country_breakdown.length > 0 ? country_breakdown[0].country : null;

    return res.status(200).json({
      total_clicks: totalClicks,
      top_platform,
      top_country,
      presave_count: presaveCount,
      presaves_locked: !user.is_pro,
      presaves: user.is_pro
        ? rawPresaves.map((p) => ({
            id: p.id,
            fan_email: p.fan_email,
            provider: p.provider,
            processed: p.processed,
            created_at: p.created_at,
            track_title: p.link.track_title,
            artist_name: p.link.artist_name,
            slug: p.link.slug,
          }))
        : [],
      platform_breakdown,
      country_breakdown,
    });
  } catch (err) {
    console.error("[/api/analytics/summary] error:", err);
    return res.status(500).json({ error: "Internal server error while summarizing analytics." });
  }
}
