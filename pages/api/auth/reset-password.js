import prisma from "../../../lib/prisma";
import { hashPassword, verifyPasswordResetToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token, password } = req.body || {};

    if (typeof token !== "string" || !token) {
      return res.status(400).json({ error: "Missing or invalid reset link." });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const payload = verifyPasswordResetToken(token);

    if (!payload || !payload.userId) {
      return res.status(400).json({
        error: "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      return res.status(400).json({
        error: "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    const password_hash = hashPassword(password);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash } });

    return res.status(200).json({ message: "Your password has been reset. You can now sign in." });
  } catch (err) {
    console.error("[/api/auth/reset-password] error:", err);
    return res.status(500).json({ error: "Internal server error while resetting your password." });
  }
}
