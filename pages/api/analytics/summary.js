import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";
import { ensurePlanCurrent, hasFullAccess } from "../../../lib/plans";

// Aggregates click + pre-save data across every SmartLink owned by the
// signed-in creator (or a single one of them, via ?link_id=), for the
// Dashboard's Analytics Panel. Click numbers cover the last ?days= days
// (7, 30, 90, 120 or 365; default 30), or a custom ?from=&to= range of
// YYYY-MM-DD dates (inclusive, up to 366 days), bucketed by UTC day:
//   - Clicks in range + previous-period comparison, daily clicks series,
//     clicks per SmartLink, single Top Platform, single Top Country (FREE)
//   - Full per-platform / per-country breakdown (PREMIUM ONLY)
//   - Fan emails collected via Pre-Saves (PREMIUM ONLY)
//
// SECURITY: the full breakdown and raw fan_email values are paid data
// assets. Free-tier accounts get the top-line summary numbers only — the
// detailed arrays are never included in the JSON response for them. This
// is enforced here, server-side, not just hidden in the UI, so a free-tier
// user inspecting network traffic cannot recover the locked data.
const ALLOWED_RANGES = [7, 30, 90, 120, 365];
const DEFAULT_RANGE = 30;
const MAX_CUSTOM_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Resolves the query to { rangeStart, days } (start of the first UTC day,
// and how many days through the last one), or { error }.
function resolveRange(query) {
  const today = startOfUtcDay(new Date());
  if (query.from || query.to) {
    const from = parseIsoDay(query.from);
    let to = parseIsoDay(query.to);
    if (!from || !to) return { error: "Pick a start and end date." };
    if (to > today) to = today;
    if (from > to) return { error: "The start date has to be before the end date." };
    const days = Math.round((to - from) / DAY_MS) + 1;
    if (days > MAX_CUSTOM_DAYS) return { error: "Pick a range of a year or less." };
    return { rangeStart: from, days, custom: true };
  }
  const requestedDays = parseInt(query.days, 10);
  const days = ALLOWED_RANGES.includes(requestedDays) ? requestedDays : DEFAULT_RANGE;
  return { rangeStart: new Date(today.getTime() - (days - 1) * DAY_MS), days, custom: false };
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// One entry per day in the range, oldest first, zero-filled so the chart
// never has gaps on quiet days.
function buildDailySeries(rangeStart, days, rows) {
  const counts = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]));
  const series = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(rangeStart.getTime() + i * DAY_MS).toISOString().slice(0, 10);
    series.push({ date, count: counts.get(date) || 0 });
  }
  return series;
}

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

    let user = await prisma.user.findUnique({ where: { id: session.userId } });

    if (!user) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    // Lazily downgrade if a monthly/yearly plan has lapsed since we last
    // checked — there's no cron, so this is checked wherever tier gating
    // actually matters.
    user = await ensurePlanCurrent(prisma, user);
    const unlocked = hasFullAccess(user);

    const range = resolveRange(req.query);
    if (range.error) {
      return res.status(400).json({ error: range.error });
    }
    const { rangeStart, days } = range;
    const rangeEnd = new Date(rangeStart.getTime() + days * DAY_MS); // exclusive
    const rangeMeta = {
      range_days: days,
      range_start: rangeStart.toISOString().slice(0, 10),
      range_end: new Date(rangeEnd.getTime() - DAY_MS).toISOString().slice(0, 10),
      range_custom: range.custom,
    };
    const requestedLinkId = typeof req.query.link_id === "string" ? req.query.link_id : "";

    const userLinks = await prisma.smartLink.findMany({
      where: { user_id: user.id },
      select: { id: true, slug: true, track_title: true, artist_name: true },
    });

    // A link_id that isn't one of this creator's links is treated as not
    // found rather than silently widening to "all links".
    if (requestedLinkId && !userLinks.some((l) => l.id === requestedLinkId)) {
      return res.status(404).json({ error: "SmartLink not found." });
    }

    const linkIds = requestedLinkId ? [requestedLinkId] : userLinks.map((l) => l.id);

    // The previous period is the same number of days immediately before
    // the selected range.
    const previousStart = new Date(rangeStart.getTime() - days * DAY_MS);

    if (linkIds.length === 0) {
      return res.status(200).json({
        ...rangeMeta,
        link_id: requestedLinkId || null,
        total_clicks: 0,
        previous_clicks: 0,
        daily: buildDailySeries(rangeStart, days, []),
        link_breakdown: [],
        top_platform: null,
        top_country: null,
        presave_count: 0,
        presaves: [],
        presaves_locked: !unlocked,
        breakdown_locked: !unlocked,
        platform_breakdown: [],
        country_breakdown: [],
      });
    }

    const clicksInRange = { link_id: { in: linkIds }, clicked_at: { gte: rangeStart, lt: rangeEnd } };

    const [
      totalClicks,
      previousClicks,
      dailyRows,
      linkGroups,
      platformGroups,
      countryGroups,
      presaveCount,
      rawPresaves,
    ] = await Promise.all([
      prisma.analytics.count({ where: clicksInRange }),
      prisma.analytics.count({
        where: { link_id: { in: linkIds }, clicked_at: { gte: previousStart, lt: rangeStart } },
      }),
      prisma.$queryRaw`
        SELECT date_trunc('day', clicked_at AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS count
        FROM analytics
        WHERE link_id = ANY(${linkIds}::uuid[]) AND clicked_at >= ${rangeStart} AND clicked_at < ${rangeEnd}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.analytics.groupBy({
        by: ["link_id"],
        where: clicksInRange,
        _count: { link_id: true },
        orderBy: { _count: { link_id: "desc" } },
      }),
      prisma.analytics.groupBy({
        by: ["platform_clicked"],
        where: clicksInRange,
        _count: { platform_clicked: true },
        orderBy: { _count: { platform_clicked: "desc" } },
      }),
      prisma.analytics.groupBy({
        by: ["fan_country"],
        where: clicksInRange,
        _count: { fan_country: true },
        orderBy: { _count: { fan_country: "desc" } },
      }),
      prisma.presave.count({ where: { link_id: { in: linkIds } } }),
      // Only ever fetch the raw rows (including fan_email) when the
      // account has an active trial or subscription.
      unlocked
        ? prisma.presave.findMany({
            where: { link_id: { in: linkIds } },
            orderBy: { created_at: "desc" },
            include: {
              link: { select: { artist_name: true, track_title: true, slug: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const linksById = new Map(userLinks.map((l) => [l.id, l]));
    const link_breakdown = linkGroups.map((g) => {
      const link = linksById.get(g.link_id) || {};
      return {
        link_id: g.link_id,
        slug: link.slug,
        track_title: link.track_title,
        artist_name: link.artist_name,
        count: g._count.link_id,
      };
    });

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
      ...rangeMeta,
      link_id: requestedLinkId || null,
      total_clicks: totalClicks,
      previous_clicks: previousClicks,
      daily: buildDailySeries(rangeStart, days, dailyRows),
      link_breakdown,
      top_platform,
      top_country,
      presave_count: presaveCount,
      presaves_locked: !unlocked,
      presaves: unlocked
        ? rawPresaves.map((p) => ({
            id: p.id,
            fan_email: p.fan_email,
            fan_phone: p.fan_phone,
            provider: p.provider,
            processed: p.processed,
            created_at: p.created_at,
            track_title: p.link.track_title,
            artist_name: p.link.artist_name,
            slug: p.link.slug,
          }))
        : [],
      // Full per-platform / per-country breakdown needs a trial or paid
      // plan. Expired accounts still get top_platform/top_country above
      // (the single winner), just not the complete ranked list.
      breakdown_locked: !unlocked,
      platform_breakdown: unlocked ? platform_breakdown : [],
      country_breakdown: unlocked ? country_breakdown : [],
    });
  } catch (err) {
    console.error("[/api/analytics/summary] error:", err);
    return res.status(500).json({ error: "Internal server error while summarizing analytics." });
  }
}
