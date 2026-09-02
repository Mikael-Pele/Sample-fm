import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";

// DEVELOPER TESTING ONLY.
// Mirrors what /api/paystack-webhook would do on a real charge.success
// event, so the Dashboard's "[Simulate Paystack $16 Subscription Success]"
// toggle can flip is_pro to true instantly without a live Paystack
// integration. This route should be removed or protected behind an env
// flag before a genuine production launch.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    const { is_pro } = req.body || {};

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { is_pro: Boolean(is_pro) },
    });

    return res.status(200).json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        is_pro: updatedUser.is_pro,
        custom_domain: updatedUser.custom_domain,
      },
    });
  } catch (err) {
    console.error("[/api/dev/simulate-upgrade] error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
