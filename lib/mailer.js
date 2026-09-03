import nodemailer from "nodemailer";

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cachedTransporter;
}

// Sends a "Report a problem" submission to the site owner's inbox
// (CONTACT_EMAIL). Never displayed publicly — this is a private delivery
// channel only. Fails silently (logs, doesn't throw) so a missing/broken
// mail config never breaks the report submission itself; the report is
// always saved to the database regardless.
export async function sendSupportReportEmail({ email, message, page_url }) {
  const to = process.env.CONTACT_EMAIL;
  const transporter = getTransporter();

  if (!to || !transporter) {
    console.warn(
      "[mailer] CONTACT_EMAIL and/or GMAIL_USER/GMAIL_APP_PASSWORD not set — report saved to the database only, no email sent."
    );
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Sample.fm" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: email || undefined,
      subject: `Sample.fm — new problem report${email ? ` from ${email}` : ""}`,
      text: [
        `From: ${email || "(no email provided)"}`,
        `Page: ${page_url || "(unknown)"}`,
        "",
        message,
      ].join("\n"),
    });
    return true;
  } catch (err) {
    console.error("[mailer] failed to send support report email:", err);
    return false;
  }
}

// Sends the "reset your password" link. Unlike the support report email,
// a failure here IS something the caller needs to know about — if this
// can't send, the user has no way to actually reset their password.
export async function sendPasswordResetEmail({ email, resetUrl }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("[mailer] GMAIL_USER/GMAIL_APP_PASSWORD not set — cannot send password reset email.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Sample.fm" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Reset your Sample.fm password",
      text: [
        "Someone (hopefully you) requested a password reset for your Sample.fm account.",
        "",
        `Reset it here: ${resetUrl}`,
        "",
        "This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.",
      ].join("\n"),
    });
    return true;
  } catch (err) {
    console.error("[mailer] failed to send password reset email:", err);
    return false;
  }
}

// Sends the "confirm your email" link on sign-up (and on resend). Fails
// silently, like the support report email — verification is informational
// here, not a login gate, so a delivery hiccup should never lock anyone
// out of an account they just created.
export async function sendVerificationEmail({ email, verifyUrl }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("[mailer] GMAIL_USER/GMAIL_APP_PASSWORD not set — cannot send verification email.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Sample.fm" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Confirm your Sample.fm email",
      text: [
        "Welcome to Sample.fm — confirm this is your email address:",
        "",
        verifyUrl,
        "",
        "This link expires in 24 hours.",
      ].join("\n"),
    });
    return true;
  } catch (err) {
    console.error("[mailer] failed to send verification email:", err);
    return false;
  }
}
