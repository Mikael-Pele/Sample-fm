import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";
import { PLAN_AMOUNTS_SUBUNIT } from "../../../lib/plans";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

// Starts a Paystack transaction for the plan the user picked in the
// billing panel, and hands back the one-time checkout URL to redirect to.
// This replaces static Payment Page links — the amount, currency, and
// which user/plan this is for are all set here, server-side, from
// lib/plans.js, so there's a single source of truth instead of a Payment
// Page in the Paystack dashboard that has to be kept in sync by hand.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = getSessionFromRequest(req);
  if (!session || !session.userId) {
    return res.status(401).json({ error: "You must be signed in." });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("[/api/billing/initialize] PAYSTACK_SECRET_KEY is not set");
    return res.status(500).json({ error: "Payments aren't configured yet." });
  }

  const { region, billing_interval } = req.body || {};
  const chosenRegion = region === "africa" ? "africa" : "global";
  const chosenInterval = billing_interval === "yearly" ? "yearly" : "monthly";
  const amount = PLAN_AMOUNTS_SUBUNIT[`${chosenRegion}_${chosenInterval}`];

  if (!amount) {
    return res.status(400).json({ error: "Unknown plan." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount,
        currency: "GHS",
        callback_url: `${APP_URL}/billing/callback`,
        metadata: {
          user_id: user.id,
          region: chosenRegion,
          billing_interval: chosenInterval,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status || !paystackData.data) {
      console.error("[/api/billing/initialize] Paystack rejected the request:", paystackData);
      return res.status(502).json({ error: "Could not start checkout. Please try again." });
    }

    return res.status(200).json({ authorization_url: paystackData.data.authorization_url });
  } catch (err) {
    console.error("[/api/billing/initialize] error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
