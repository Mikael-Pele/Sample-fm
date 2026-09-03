import prisma from "../../../lib/prisma";
import { getSessionFromRequest } from "../../../lib/auth";
import { sendSupportReportEmail } from "../../../lib/mailer";

const MAX_MESSAGE_LENGTH = 4000;

function sanitizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, message, page_url } = req.body || {};

    const cleanMessage = sanitizeString(message);
    if (!cleanMessage) {
      return res.status(400).json({ error: "Please describe the problem before submitting." });
    }
    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: "Message is too long." });
    }

    const session = getSessionFromRequest(req);
    const cleanEmail = sanitizeString(email);
    const cleanPageUrl = sanitizeString(page_url);

    const report = await prisma.supportReport.create({
      data: {
        user_id: session && session.userId ? session.userId : null,
        email: cleanEmail,
        message: cleanMessage,
        page_url: cleanPageUrl,
      },
    });

    console.log(`[/api/support/report] new report ${report.id} from ${cleanEmail || "anonymous"}`);

    // Best-effort — the report is already safely in the database above, so
    // an email failure (missing config, Gmail rate limit, etc.) should
    // never turn into a failed submission for the person reporting it. We
    // await it (rather than fire-and-forget) because serverless functions
    // can freeze immediately after the response is sent.
    await sendSupportReportEmail({
      email: cleanEmail,
      message: cleanMessage,
      page_url: cleanPageUrl,
    }).catch(() => {});

    return res.status(201).json({ received: true });
  } catch (err) {
    console.error("[/api/support/report] error:", err);
    return res.status(500).json({ error: "Internal server error while submitting your report." });
  }
}
