import prisma from "../../../lib/prisma";
import { verifyEmailVerificationToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token } = req.body || {};

    if (typeof token !== "string" || !token) {
      return res.status(400).json({ error: "Missing or invalid verification link." });
    }

    const payload = verifyEmailVerificationToken(token);

    if (!payload || !payload.userId) {
      return res.status(400).json({
        error: "This verification link is invalid or has expired. Please request a new one.",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      return res.status(400).json({
        error: "This verification link is invalid or has expired. Please request a new one.",
      });
    }

    if (!user.email_verified) {
      await prisma.user.update({ where: { id: user.id }, data: { email_verified: true } });
    }

    return res.status(200).json({ message: "Your email is verified." });
  } catch (err) {
    console.error("[/api/auth/verify-email] error:", err);
    return res.status(500).json({ error: "Internal server error while verifying your email." });
  }
}
