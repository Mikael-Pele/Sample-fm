import prisma from "../../../lib/prisma";
import { getSessionFromRequest, signEmailVerificationToken } from "../../../lib/auth";
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
    const session = getSessionFromRequest(req);
    if (!session || !session.userId) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    if (user.email_verified) {
      return res.status(200).json({ message: "Your email is already verified." });
    }

    const verifyToken = signEmailVerificationToken({ userId: user.id, email: user.email });
    const verifyUrl = `${resolveAppUrl(req)}/verify-email?token=${encodeURIComponent(verifyToken)}`;
    const sent = await sendVerificationEmail({ email: user.email, verifyUrl });

    if (!sent) {
      return res.status(502).json({ error: "Could not send the verification email. Please try again shortly." });
    }

    return res.status(200).json({ message: "Verification email sent." });
  } catch (err) {
    console.error("[/api/auth/resend-verification] error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
