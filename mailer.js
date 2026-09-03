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
