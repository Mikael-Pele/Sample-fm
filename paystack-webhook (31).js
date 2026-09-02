import crypto from "crypto";
import prisma from "../../lib/prisma";
import { matchPlanByAmount, computeExpiryFromNow } from "../../lib/plans";

// Paystack requires the raw request body to validate the HMAC signature,
// so we disable Next's default JSON body parsing for this route only.
export const config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function isValidPaystackSignature(rawBody, signatureHeader, secretKey) {
  if (!signatureHeader || !secretKey) return false;
  const expectedHash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");
  return expectedHash === signatureHeader;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["x-paystack-signature"];

    if (!isValidPaystackSignature(rawBody, signature, secretKey)) {
      console.warn("[/api/paystack-webhook] rejected: invalid signature");
      return res.status(401).json({ error: "Invalid webhook signature." });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch (parseErr) {
      return res.status(400).json({ error: "Malformed JSON payload." });
    }

    const { event, data } = payload || {};

    // Always 200 unknown/irrelevant events so Paystack doesn't retry forever.
    if (event !== "charge.success") {
      return res.status(200).json({ received: true, ignored: true });
    }

    const customerEmail = data && data.customer && data.customer.email;
    const amountPaid = data && data.amount; // in kobo/cents
    const paystackReference = data && data.reference;

    if (!customerEmail) {
      console.warn("[/api/paystack-webhook] charge.success missing customer email");
      return res.status(200).json({ received: true, ignored: true, reason: "no_customer_email" });
    }

    if (typeof amountPaid !== "number") {
      console.warn("[/api/paystack-webhook] charge.success missing amount");
      return res.status(200).json({ received: true, ignored: true, reason: "no_amount" });
    }

    // Map the amount actually charged back to Premium monthly or yearly. An
    // amount that doesn't match anything we sell is ignored rather than
    // granting access on a guess.
    const matched = matchPlanByAmount(amountPaid);
    if (!matched) {
      console.warn(
        `[/api/paystack-webhook] charge.success amount (${amountPaid}) didn't match any known plan, skipping`
      );
      return res.status(200).json({ received: true, ignored: true, reason: "amount_mismatch" });
    }

    const normalizedEmail = customerEmail.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      console.warn(
        `[/api/paystack-webhook] charge.success for unknown user email: ${normalizedEmail}`
      );
      return res.status(200).json({ received: true, ignored: true, reason: "user_not_found" });
    }

    const plan_expires_at = computeExpiryFromNow(matched.billing_interval);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        is_pro: true,
        plan: matched.plan,
        billing_interval: matched.billing_interval,
        plan_expires_at,
        pricing_region: matched.region,
      },
    });

    console.log(
      `[/api/paystack-webhook] SUCCESS: user ${updatedUser.email} upgraded to ${matched.plan} ` +
        `(${matched.region} pricing, ${matched.billing_interval}). Paystack reference: ${
          paystackReference || "n/a"
        }`
    );

    return res.status(200).json({
      received: true,
      upgraded: true,
      user_id: updatedUser.id,
      plan: updatedUser.plan,
      region: updatedUser.pricing_region,
      billing_interval: updatedUser.billing_interval,
      reference: paystackReference || null,
    });
  } catch (err) {
    console.error("[/api/paystack-webhook] error:", err);
    return res.status(500).json({ error: "Internal server error while processing webhook." });
  }
}
