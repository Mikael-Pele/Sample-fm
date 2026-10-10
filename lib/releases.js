import { cleanText, parseDateOnly } from "./fieldClean";

export const RELEASE_STATUSES = ["live", "soon", "draft"];

export function validateRelease(body) {
  const payload = body || {};
  const title = cleanText(payload.title, 160);
  if (!title) return { error: "Give the release a title." };

  const status = RELEASE_STATUSES.includes(payload.status) ? payload.status : null;
  if (!status) return { error: "Status must be Live, Soon or Draft." };

  const release_date = parseDateOnly(payload.release_date);
  if (release_date === undefined) return { error: "Release date isn't a valid date." };

  return {
    data: {
      title,
      status,
      distributor: cleanText(payload.distributor, 80),
      release_date,
    },
  };
}

export function serializeRelease(release) {
  return {
    id: release.id,
    title: release.title,
    status: release.status,
    distributor: release.distributor,
    release_date: release.release_date ? release.release_date.toISOString().slice(0, 10) : null,
    created_at: release.created_at.toISOString(),
  };
}
