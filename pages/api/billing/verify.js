import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";
import { matchPlanByAmount, grantPremium } from "../../../lib/plans";

// Called by the /billing/callback page right after Paystack redirects the
// user back. This is what gives them an immediate "you're upgraded" — the
// webhook (pages/api/paystack-webhook.js) is still the authoritative,
// server-to-server source of truth in case the user closes the tab before
// this ever runs, so this handler is safe to call more than once.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = getSessionFromRequest(req);
  if (!session || !session.userId) {
    return res.status(401).json({ error: "You must be signed in." });
  }

  const { reference } = req.query;
  if (!reference || typeof reference !== "string") {
    return res.status(400).json({ error: "Missing payment reference." });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("[/api/billing/verify] PAYSTACK_SECRET_KEY is not set");
    return res.status(500).json({ error: "Payments aren't configured yet." });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status || !paystackData.data) {
      console.error("[/api/billing/verify] Paystack verify failed:", paystackData);
      return res.status(502).json({ success: false, error: "Could not verify payment." });
    }

    const { status, amount, customer } = paystackData.data;

    if (status !== "success") {
      return res.status(200).json({ success: false, reason: "not_successful" });
    }

    const matched = matchPlanByAmount(amount);
    if (!matched) {
      console.warn(`[/api/billing/verify] amount (${amount}) didn't match any known plan`);
      return res.status(200).json({ success: false, reason: "amount_mismatch" });
    }

    const updatedUser = await grantPremium(prisma, {
      email: customer && customer.email,
      region: matched.region,
      billing_interval: matched.billing_interval,
    });

    // Only let this endpoint confirm an upgrade for the person who's
    // actually signed in right now — not whichever email Paystack reports.
    if (!updatedUser || updatedUser.id !== session.userId) {
      return res.status(200).json({ success: false, reason: "user_mismatch" });
    }

    return res.status(200).json({
      success: true,
      plan: updatedUser.plan,
      region: updatedUser.pricing_region,
      billing_interval: updatedUser.billing_interval,
    });
  } catch (err) {
    console.error("[/api/billing/verify] error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}
