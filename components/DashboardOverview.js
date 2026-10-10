import ClicksChart from "./ClicksChart";
import { initialsFor } from "./DashboardLayout";

export function StatTile({ label, value, hint, hintClass = "text-base-muted" }) {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 min-w-0">
      <div className="text-base-muted text-xs font-semibold uppercase tracking-wide mb-2 truncate">
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-extrabold text-fg truncate">{value}</div>
      {hint ? <div className={`text-xs font-semibold mt-1.5 truncate ${hintClass}`}>{hint}</div> : null}
    </div>
  );
}

function Card({ title, action, onAction, children, className = "" }) {
  return (
    <div className={`glass-card rounded-xl2 overflow-hidden min-w-0 ${className}`}>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-base-border">
        <h2 className="font-bold text-sm truncate">{title}</h2>
        {action && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-semibold text-brand-light hover:text-brand transition whitespace-nowrap"
          >
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// The Dashboard landing page: stat row, then the clicks chart beside a
// SmartLinks + Releases column, then a full-width EPK strip.
export default function DashboardOverview({
  analytics,
  links,
  linksHint,
  ranges,
  range,
  onRangeChange,
  delta,
  platformMeta,
  platformFields,
  artistName,
  onNavigate,
  onShowLinkStats,
  onUpgrade,
}) {
  const clicksByLink = new Map(
    ((analytics && analytics.link_breakdown) || []).map((row) => [row.link_id, row.count])
  );
  const topLinks = [...links]
    .sort((a, b) => (clicksByLink.get(b.id) || 0) - (clicksByLink.get(a.id) || 0))
    .slice(0, 4);
  const maxLinkClicks = Math.max(1, ...topLinks.map((l) => clicksByLink.get(l.id) || 0));

  const topPlatforms = ((analytics && analytics.platform_breakdown) || []).slice(0, 4);
  const lifetimeClicks = links.reduce((sum, l) => sum + (l._count?.analytics ?? 0), 0);
  const lifetimePresaves = links.reduce((sum, l) => sum + (l._count?.presaves ?? 0), 0);
  const platformsUsed = platformFields.filter((f) => links.some((l) => l[f.key]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label={`Clicks (${range}d)`}
          value={analytics ? analytics.total_clicks.toLocaleString() : "—"}
          hint={delta.text}
          hintClass={delta.className}
        />
        <StatTile
          label="Active SmartLinks"
          value={links.length}
          hint={linksHint}
        />
        <StatTile label="Pre-Saves" value={analytics ? analytics.presave_count : "—"} />
        <StatTile
          label="Top Platform"
          value={
            analytics && analytics.top_platform
              ? (platformMeta[analytics.top_platform] || {}).label || analytics.top_platform
              : "—"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-xl2 overflow-hidden min-w-0 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-base-border">
            <h2 className="font-bold text-sm">Link Clicks — Last {range} Days</h2>
            <div role="group" aria-label="Date range" className="flex shrink-0">
              {ranges.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => onRangeChange(days)}
                  aria-pressed={range === days}
                  className={`px-2.5 py-1.5 text-xs font-semibold border-b-2 transition ${
                    range === days
                      ? "border-brand text-fg"
                      : "border-transparent text-base-muted hover:text-fg"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
          <div className="px-3 sm:px-4 pt-4 pb-2">
            {analytics ? <ClicksChart daily={analytics.daily} /> : <div className="h-[180px]" />}
          </div>

          <div className="px-4 sm:px-5 py-3 border-t border-base-border font-bold text-xs">
            By Platform
          </div>
          <div className="px-4 sm:px-5 pb-4 space-y-2.5">
            {analytics && analytics.breakdown_locked ? (
              <p className="text-xs text-base-muted py-2">
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="text-brand-light hover:text-brand font-semibold"
                >
                  Subscribe
                </button>{" "}
                to see which platforms your fans pick.
              </p>
            ) : topPlatforms.length > 0 ? (
              topPlatforms.map((row) => {
                const meta = platformMeta[row.platform] || { label: row.platform, barClass: "bg-brand" };
                const share = Math.round((row.count / (analytics.total_clicks || 1)) * 100);
                return (
                  <div key={row.platform} className="flex items-center gap-2.5">
                    <span className="text-xs w-24 shrink-0 font-medium truncate">{meta.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-base-bg overflow-hidden">
                      <div className={`h-full ${meta.barClass}`} style={{ width: `${Math.max(4, share)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-base-muted w-9 text-right shrink-0 tabular-nums">
                      {share}%
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-base-muted py-2">No clicks in this period yet.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <Card title="SmartLinks" action="View all" onAction={() => onNavigate("smartlinks")}>
            <div className="px-4 sm:px-5 py-1.5">
              {topLinks.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-base-muted mb-3">No SmartLinks yet.</p>
                  <button
                    type="button"
                    onClick={() => onNavigate("smartlinks")}
                    className="bg-brand hover:bg-brand-dark transition text-white text-xs font-bold rounded-lg px-4 py-2"
                  >
                    Create your first
                  </button>
                </div>
              ) : (
                topLinks.map((link) => {
                  const count = clicksByLink.get(link.id) || 0;
                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => onShowLinkStats(link.id)}
                      className="w-full flex items-center gap-3 py-2.5 border-b border-base-border/60 last:border-b-0 text-left group"
                    >
                      <span className="w-10 h-10 rounded-lg bg-base-bg overflow-hidden shrink-0">
                        {link.artwork_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={link.artwork_url} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold truncate group-hover:text-brand-light transition">
                          {link.track_title}
                        </span>
                        <span className="block text-xs text-base-muted truncate">droppa.fm/{link.slug}</span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="block text-sm font-bold tabular-nums">{count.toLocaleString()}</span>
                        <span className="block w-14 h-1 rounded-full bg-base-bg overflow-hidden mt-1">
                          <span
                            className="block h-full bg-brand"
                            style={{ width: `${Math.max(6, Math.round((count / maxLinkClicks) * 100))}%` }}
                          />
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          <Card title="Upcoming Releases" action="+ Add" onAction={() => onNavigate("releases")}>
            <div className="px-4 sm:px-5 py-6 text-center">
              <p className="text-sm text-base-muted">
                The release tracker is coming soon. Upcoming, live and draft releases will show here.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Your EPK — Electronic Press Kit" action="Edit profile" onAction={() => onNavigate("epk")}>
        <div className="p-4 sm:p-5">
          <div className="relative overflow-hidden rounded-xl bg-base-bg border border-base-border p-5 flex flex-col gap-3">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at top right, rgb(var(--c-brand) / 0.14) 0%, transparent 65%)",
              }}
              aria-hidden="true"
            />
            <span className="relative w-14 h-14 rounded-full bg-gradient-to-br from-brand to-[#ff8c00] flex items-center justify-center text-white text-xl font-extrabold">
              {initialsFor(artistName)}
            </span>
            <div className="relative">
              <div className="text-lg font-extrabold">{artistName}</div>
              <div className="text-xs text-base-muted">Your press kit page is coming soon</div>
            </div>
            <div className="relative flex gap-6">
              <div>
                <div className="font-bold tabular-nums">{lifetimeClicks.toLocaleString()}</div>
                <div className="text-[11px] text-base-muted">Link clicks</div>
              </div>
              <div>
                <div className="font-bold tabular-nums">{links.length}</div>
                <div className="text-[11px] text-base-muted">SmartLinks</div>
              </div>
              <div>
                <div className="font-bold tabular-nums">{lifetimePresaves.toLocaleString()}</div>
                <div className="text-[11px] text-base-muted">Pre-saves</div>
              </div>
            </div>
            {platformsUsed.length > 0 && (
              <div className="relative flex flex-wrap gap-2">
                {platformsUsed.map((f) => (
                  <span
                    key={f.key}
                    className="text-[11px] bg-base-card border border-base-border rounded px-2 py-0.5 text-base-muted"
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              disabled
              className="relative self-start bg-brand text-white text-xs font-bold rounded-md px-3.5 py-2 opacity-60 cursor-not-allowed"
              title="Coming soon"
            >
              Share EPK →
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
