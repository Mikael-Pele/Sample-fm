import { cleanText, parseDateOnly } from "./fieldClean";

function isHttpUrl(value, { httpsOnly = false } = {}) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (!httpsOnly && url.protocol === "http:");
  } catch (err) {
    return false;
  }
}

export const RELEASE_STATUSES = ["live", "soon", "draft"];

export function validateRelease(body) {
  const payload = body || {};
  const title = cleanText(payload.title, 160);
  if (!title) return { error: "Give the release a title." };

  const status = RELEASE_STATUSES.includes(payload.status) ? payload.status : null;
  if (!status) return { error: "Status must be Live, Soon or Draft." };

  const release_date = parseDateOnly(payload.release_date);
  if (release_date === undefined) return { error: "Release date isn't a valid date." };

  const artwork_url = cleanText(payload.artwork_url, 600);
  if (artwork_url && !isHttpUrl(artwork_url, { httpsOnly: true })) {
    return { error: "Cover art must be an uploaded image or an https:// link." };
  }

  let link_url = cleanText(payload.link_url, 600);
  if (link_url && !/^https?:\/\//i.test(link_url)) link_url = `https://${link_url}`;
  if (link_url && !isHttpUrl(link_url)) {
    return { error: "The release link must be a web address, like droppa.fm/your-song." };
  }

  return {
    data: {
      title,
      status,
      distributor: cleanText(payload.distributor, 80),
      release_date,
      artwork_url,
      link_url,
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
    artwork_url: release.artwork_url,
    link_url: release.link_url,
    created_at: release.created_at.toISOString(),
  };
}
