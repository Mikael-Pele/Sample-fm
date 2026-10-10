import prisma from "./prisma";
import { getSessionFromRequest } from "./auth";
import { ensurePlanCurrent, hasFullAccess } from "./plans";

// Shared plumbing for the artist-dashboard API routes (releases, payouts,
// EPK). Loads the signed-in user, or answers the request itself and
// returns null. Writes need an active trial or subscription, the same rule
// as creating and editing SmartLinks; reads always work so an expired
// account can still see its own data.
export async function loadDashboardUser(req, res, { write = false } = {}) {
  const session = getSessionFromRequest(req);
  if (!session || !session.userId) {
    res.status(401).json({ error: "You must be signed in." });
    return null;
  }

  let user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    res.status(401).json({ error: "You must be signed in." });
    return null;
  }
  user = await ensurePlanCurrent(prisma, user);

  if (write && !hasFullAccess(user)) {
    res.status(402).json({
      error: "Your free trial has ended. Subscribe to Droppa.fm Artist to make changes.",
      code: "subscription_required",
    });
    return null;
  }

  return user;
}
