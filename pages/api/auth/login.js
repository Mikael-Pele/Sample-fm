import prisma from "../../../lib/prisma";
import { verifyPassword, signSessionToken, setSessionCookie, isValidEmail } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const passwordMatches = verifyPassword(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signSessionToken({ userId: user.id, email: user.email });
    setSessionCookie(res, token);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        is_pro: user.is_pro,
        custom_domain: user.custom_domain,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("[/api/auth/login] error:", err);
    return res.status(500).json({ error: "Internal server error during login." });
  }
}
