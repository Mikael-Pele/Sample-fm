import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";
import { computeExpiryFromNow } from "../../../lib/plans";

// DEVELOPER TESTING ONLY.
// Mirrors what /api/paystack-webhook would do on a real charge.success
// event, so the Dashboard's testing toggle can flip a user's plan
// instantly without a live Paystack integration. Hard-blocked in
// production below.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Hard production kill-switch. Without this, ANY signed-in user could hit
  // this endpoint directly (bypassing the UI entirely) and grant themselves
  // a paid plan for free. Set ALLOW_DEV_UPGRADE=true in a non-production
  // environment (e.g. a Vercel preview deployment) if you need this for QA.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_UPGRADE !== "true") {
    return res.status(404).json({ error: "Not found." });
  }

  try {
    const session = getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    const { is_pro, billing_interval, region } = req.body || {};

    let data;
    if (!is_pro) {
      data = {
        is_pro: false,
        plan: "free",
        billing_interval: null,
        plan_expires_at: null,
        pricing_region: null,
      };
    } else {
      const chosenInterval = billing_interval === "yearly" ? "yearly" : "monthly";
      const chosenRegion = region === "africa" ? "africa" : "global";
      data = {
        is_pro: true,
        plan: "premium",
        billing_interval: chosenInterval,
        plan_expires_at: computeExpiryFromNow(chosenInterval),
        pricing_region: chosenRegion,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data,
    });

    return res.status(200).json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        is_pro: updatedUser.is_pro,
        plan: updatedUser.plan,
        billing_interval: updatedUser.billing_interval,
        pricing_region: updatedUser.pricing_region,
        custom_domain: updatedUser.custom_domain,
      },
    });
  } catch (err) {
    console.error("[/api/dev/simulate-upgrade] error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
