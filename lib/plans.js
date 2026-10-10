// Single source of truth for Droppa.fm's pricing, shared by the landing
// page, the dashboard billing panel, and the Paystack routes that have to
// map a paid amount back to a plan.
//
// One plan, one price for everyone: a yearly Droppa.fm Artist subscription at
// a founding-artist price, after a 7-day free trial that every new account
// starts on automatically. The trial allows one SmartLink. There is no forever-free tier and no regional
// pricing (so nothing for a VPN to game).
export const TRIAL_DAYS = 7;
export const TRIAL_LINK_LIMIT = 1;

export const PLAN = {
  name: "Droppa.fm Artist",
  interval: "yearly",
  priceUsd: 49,
};

// What actually gets CHARGED on Paystack, in Ghanaian Cedis (this account is
// Ghana-registered, and a standard Ghanaian Paystack account can't charge in
// USD without separate approval). PLAN.priceUsd above is display-only. This
// is a round number tracking $49 at the Bank of Ghana rate (~GH₵11.27/$1 as
// of Sept 2026), not a live FX conversion — revisit it if the rate drifts a
// lot. Paystack converts for cards issued outside Ghana.
export const PLAN_PRICE_GHS = 550;

// Paystack amounts are in pesewas (smallest unit of the Cedi) — GHS * 100.
export const PLAN_AMOUNT_SUBUNIT = PLAN_PRICE_GHS * 100;

// Features that exist in the product but aren't finished yet, so the UI
// shows them as "coming soon" and the API ignores them for everyone.
export const COMING_SOON_FEATURES = ["Custom domain", "Facebook & TikTok pixels", "Team logins"];
export const PIXELS_ENABLED = false;
export const CUSTOM_DOMAINS_ENABLED = false;

const DAY_MS = 24 * 60 * 60 * 1000;

// Always "a year from now", not stacked on an existing expiry: the webhook
// and the callback page both grant the same payment, so this has to be safe
// to run twice.
export function computeExpiryFromNow() {
  return new Date(Date.now() + 366 * DAY_MS);
}

// The trial is counted from when the account was created, so it needs no
// extra column and can't be restarted.
export function trialEndsAt(user) {
  if (!user || !user.created_at) return null;
  return new Date(new Date(user.created_at).getTime() + TRIAL_DAYS * DAY_MS);
}

// "active" = paid and within the year, "trial" = inside the free trial,
// "expired" = neither. Trial and active get every feature; expired accounts
// keep their dashboard and live SmartLinks but can't create or edit links
// until they subscribe.
export function getAccessStatus(user) {
  if (!user) return "expired";
  if (user.is_pro) {
    if (!user.plan_expires_at || new Date(user.plan_expires_at).getTime() > Date.now()) return "active";
  }
  const trialEnd = trialEndsAt(user);
  if (trialEnd && trialEnd.getTime() > Date.now()) return "trial";
  return "expired";
}

export function hasFullAccess(user) {
  return getAccessStatus(user) !== "expired";
}

// Checks a charged amount (pesewas) against the plan price, within a small
// tolerance for currency-conversion rounding. Returns null if it doesn't
// match (better to ignore an unrecognized charge than grant access on a
// guess).
export function matchPlanByAmount(amountSubunit) {
  const TOLERANCE = 0.03; // 3%
  const diff = Math.abs(amountSubunit - PLAN_AMOUNT_SUBUNIT) / PLAN_AMOUNT_SUBUNIT;
  if (diff >= TOLERANCE) return null;
  return { plan: "premium", billing_interval: PLAN.interval };
}

// Upgrades a user to the paid plan. Shared by the webhook (server-to-server,
// authoritative) and the billing callback page (immediate UI feedback) so
// there's exactly one place that writes these fields. Returns null if no
// user has that email, rather than throwing — both callers just log/ignore.
export async function grantPremium(prisma, { email }) {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return null;

  return prisma.user.update({
    where: { id: user.id },
    data: {
      is_pro: true,
      plan: "premium",
      billing_interval: PLAN.interval,
      plan_expires_at: computeExpiryFromNow(),
      pricing_region: null,
    },
  });
}

// Lazily downgrades a user whose paid year has lapsed ("free" here just
// means "not paying"; see getAccessStatus for what they can still do).
// There's no cron here, so this runs at the points a user's status
// actually matters: dashboard load and the gated API routes.
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
