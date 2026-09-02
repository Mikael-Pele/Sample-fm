import { isAfricanCountry } from "./geo";

// Single source of truth for Sample.fm's pricing, shared by the landing
// page, the dashboard billing panel, and the Paystack webhook that has to
// map a paid amount back to a plan.
//
// PPP-style regional pricing: the same Premium plan, priced differently for
// African signups vs the rest of the world — the same approach Spotify uses
// (their Nigeria price is roughly $1/mo vs ~$12/mo in the US). Region is
// detected from the visitor's IP-geo header at signup/billing time, the
// same signal already used to prioritize Audiomack/Boomplay on fan pages.
// Both regions are shown in dollars on-site — the split is purely about
// what number is shown, not what currency it's shown in.
export const FREE_TIER_LINK_LIMIT = 3;

export const REGION_PRICING = {
  africa: { label: "Africa", monthly: 5, yearly: 50 },
  global: { label: "Global", monthly: 24.99, yearly: 249.9 },
};

export function getRegionForCountry(countryCode) {
  return isAfricanCountry(countryCode) ? "africa" : "global";
}

// What actually gets CHARGED on Paystack, in Naira. REGION_PRICING above is
// USD-denominated and only ever used for on-site *display* — it is never
// sent to Paystack. This split exists because a standard Nigerian Paystack
// account can't charge in USD by default (that needs a separate
// "international payments" approval + a USD domiciliary account), so every
// Payment Page here — including the "Global" ones — has to be created in
// NGN. These are round numbers roughly tracking the USD price at the
// CBN/black-market rate (~₦1,330–1,410/$1), not a live FX conversion, so
// they don't need to be updated every time the naira moves.
export const PLAN_PRICES_NGN = {
  africa_monthly: 8000,
  africa_yearly: 80000,
  global_monthly: 40000,
  global_yearly: 400000,
};

// Paystack amounts are in kobo (smallest unit of the Naira) — NGN * 100.
export const PLAN_AMOUNTS_KOBO = {
  africa_monthly: PLAN_PRICES_NGN.africa_monthly * 100,
  africa_yearly: PLAN_PRICES_NGN.africa_yearly * 100,
  global_monthly: PLAN_PRICES_NGN.global_monthly * 100,
  global_yearly: PLAN_PRICES_NGN.global_yearly * 100,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeExpiryFromNow(billingInterval) {
  if (billingInterval === "monthly") return new Date(Date.now() + 31 * DAY_MS);
  if (billingInterval === "yearly") return new Date(Date.now() + 366 * DAY_MS);
  return null;
}

// Matches a charged amount (kobo) to the closest known region/interval,
// within a small tolerance for currency-conversion rounding. Returns null
// if nothing matches closely enough (better to ignore an unrecognized
// charge than silently grant access on a guess).
export function matchPlanByAmount(amountKobo) {
  const TOLERANCE = 0.03; // 3%
  let best = null;
  let bestDiff = Infinity;

  for (const [key, amount] of Object.entries(PLAN_AMOUNTS_KOBO)) {
    const diff = Math.abs(amountKobo - amount) / amount;
    if (diff < TOLERANCE && diff < bestDiff) {
      bestDiff = diff;
      best = key;
    }
  }

  if (!best) return null;
  const [region, interval] = best.split("_");
  return { plan: "premium", region, billing_interval: interval };
}

// Lazily downgrades a user whose plan has lapsed. There's no cron here, so
// this runs at the points a user's status actually matters: dashboard load
// and the gated API routes.
export async function ensurePlanCurrent(prisma, user) {
  if (!user || !user.is_pro) return user;
  if (!user.plan_expires_at) return user; // no expiry recorded — leave as-is
  if (new Date(user.plan_expires_at).getTime() > Date.now()) return user;

  return prisma.user.update({
    where: { id: user.id },
    data: {
      is_pro: false,
      plan: "free",
      billing_interval: null,
      plan_expires_at: null,
      pricing_region: null,
    },
  });
}
