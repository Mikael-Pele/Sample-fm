import prisma from "../../../lib/prisma";
import {
  hashPassword,
  signSessionToken,
  setSessionCookie,
  isValidEmail,
  signEmailVerificationToken,
} from "../../../lib/auth";
import { sendVerificationEmail } from "../../../lib/mailer";

function resolveAppUrl(req) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  return host ? `${proto}://${host}` : "";
}

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

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const password_hash = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password_hash,
        is_pro: false,
      },
    });

    const token = signSessionToken({ userId: user.id, email: user.email });
    setSessionCookie(res, token);

    // Best-effort — never blocks account creation. A user who never gets
    // this email can still use the account fully; they just see a "verify
    // your email" nudge in the dashboard until they do (or resend it).
    const verifyToken = signEmailVerificationToken({ userId: user.id, email: user.email });
    const verifyUrl = `${resolveAppUrl(req)}/verify-email?token=${encodeURIComponent(verifyToken)}`;
    sendVerificationEmail({ email: user.email, verifyUrl }).catch(() => {});

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        is_pro: user.is_pro,
        email_verified: user.email_verified,
        custom_domain: user.custom_domain,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("[/api/auth/register] error:", err);
    return res.status(500).json({ error: "Internal server error during registration." });
  }
}
