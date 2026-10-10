import { initialsFor } from "./DashboardLayout";

function SourceTag({ verified }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M5 12l5 5L20 7" />
      </svg>
      Verified by Droppa
    </span>
  ) : (
    <span className="text-[10px] font-bold uppercase tracking-wide text-base-muted">Self-reported</span>
  );
}

function Stat({ label, value, verified }) {
  return (
    <div className="bg-base-card border border-base-border rounded-xl p-4 min-w-0">
      <div className="text-2xl font-extrabold tabular-nums truncate">{value}</div>
      <div className="text-xs text-base-muted mt-0.5 mb-2">{label}</div>
      <SourceTag verified={verified} />
    </div>
  );
}

// The press kit itself, shared by the public /epk/[handle] page and the
// live preview in the dashboard editor. `epk.visibility` decides which
// sections render; `stats` are the Droppa-verified numbers.
export default function EpkPublicView({ epk, stats }) {
  const show = epk.visibility || {};
  const name = epk.display_name || "Artist";
  const quotes = (epk.press_quotes || []).filter((q) => q && q.quote);
  // The editor preview can hold a bare email that the API hasn't turned
  // into a mailto: link yet.
  const rawBooking = epk.booking_contact || "";
  const bookingHref = !rawBooking
    ? null
    : /^(mailto:|https?:\/\/)/i.test(rawBooking)
    ? rawBooking
    : rawBooking.includes("@")
    ? `mailto:${rawBooking}`
    : `https://${rawBooking}`;
  const bookingLabel = bookingHref
    ? bookingHref.startsWith("mailto:")
      ? bookingHref.slice(7)
      : bookingHref.replace(/^https?:\/\//, "")
    : null;

  const statTiles = [
    show.clicks && { label: "SmartLink clicks", value: stats.clicks.toLocaleString(), verified: true },
    show.releases && { label: stats.releases === 1 ? "Release" : "Releases", value: stats.releases, verified: true },
    show.monthly_streams &&
      epk.monthly_streams !== null &&
      epk.monthly_streams !== undefined && {
        label: "Monthly streams",
        value: Number(epk.monthly_streams).toLocaleString(),
        verified: false,
      },
  ].filter(Boolean);

  return (
    <article className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center gap-5">
        {show.photo && (
          <div className="w-28 h-28 rounded-full overflow-hidden bg-base-card border border-base-border shrink-0 flex items-center justify-center">
            {epk.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={epk.photo_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-extrabold text-base-muted">{initialsFor(name)}</span>
            )}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-base-muted mb-1">
            Electronic Press Kit
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold break-words">{name}</h1>
          {show.booking && bookingHref && (
            <a
              href={bookingHref}
              target={bookingHref.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="inline-block mt-3 bg-brand hover:bg-brand-dark transition text-white text-sm font-semibold rounded-lg px-4 py-2"
            >
              Bookings and enquiries
            </a>
          )}
        </div>
      </header>

      {statTiles.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {statTiles.map((t) => (
            <Stat key={t.label} {...t} />
          ))}
        </section>
      )}

      {show.bio && epk.bio && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-base-muted mb-2">Biography</h2>
          <p className="text-[15px] leading-relaxed whitespace-pre-line">{epk.bio}</p>
        </section>
      )}

      {show.platforms && stats.platforms.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-base-muted">Available on</h2>
            <SourceTag verified />
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.platforms.map((p) => (
              <span key={p} className="text-sm bg-base-card border border-base-border rounded-lg px-3 py-1.5">
                {p}
              </span>
            ))}
          </div>
        </section>
      )}

      {show.press_quotes && quotes.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-base-muted">Press</h2>
            <SourceTag verified={false} />
          </div>
          <div className="space-y-3">
            {quotes.map((q, i) => (
              <blockquote key={i} className="border-l-2 border-brand pl-4">
                <p className="text-[15px] leading-relaxed">&ldquo;{q.quote}&rdquo;</p>
                {q.source && <footer className="text-xs text-base-muted mt-1">{q.source}</footer>}
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {show.booking && bookingLabel && (
        <section className="border-t border-base-border pt-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-base-muted mb-1">Booking contact</h2>
          <a href={bookingHref} className="text-brand-light hover:text-brand break-all">
            {bookingLabel}
          </a>
        </section>
      )}
    </article>
  );
}
