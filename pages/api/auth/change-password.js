import prisma from "../../../lib/prisma";
import { getSessionFromRequest, verifyPassword, hashPassword } from "../../../lib/auth";

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

    const { current_password, new_password } = req.body || {};

    if (typeof current_password !== "string" || !current_password) {
      return res.status(400).json({ error: "Please enter your current password." });
    }

    if (typeof new_password !== "string" || new_password.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    if (!verifyPassword(current_password, user.password_hash)) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const password_hash = hashPassword(new_password);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash } });

    return res.status(200).json({ message: "Your password has been updated." });
  } catch (err) {
    console.error("[/api/auth/change-password] error:", err);
    return res.status(500).json({ error: "Internal server error while changing your password." });
  }
}
