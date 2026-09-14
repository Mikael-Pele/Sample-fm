import prisma from "../../../lib/prisma";
import { isValidEmail, signPasswordResetToken } from "../../../lib/auth";
import { sendPasswordResetEmail } from "../../../lib/mailer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

function resolveAppUrl(req) {
  if (APP_URL) return APP_URL;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  return host ? `${proto}://${host}` : "";
}

// Always responds with the same generic success message whether or not the
// email belongs to an account — this is deliberate: telling a visitor
// "no account with that email" lets them enumerate which emails are
// registered on the platform, one guess at a time.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GENERIC_MESSAGE = "If an account exists for that email, a reset link has been sent.";

  try {
    const { email } = req.body || {};

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const token = signPasswordResetToken({ userId: user.id, email: user.email });
      const resetUrl = `${resolveAppUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail({ email: user.email, resetUrl }).catch(() => {});
    }

    return res.status(200).json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error("[/api/auth/forgot-password] error:", err);
    // Still return the generic message — don't leak internal state via a
    // different response shape on error vs success.
    return res.status(200).json({ message: GENERIC_MESSAGE });
  }
}
