import Link from "next/link";
import { DroppaFmMark } from "./PlatformIcons";

// Sidebar navigation for the artist dashboard. Each page is a ?page= value
// on /dashboard (shallow-routed), so the server-side auth in
// pages/dashboard.js runs once and page switches are instant.
export const DASHBOARD_NAV = [
  {
    section: "Overview",
    items: [
      { key: "overview", label: "Dashboard", icon: "◈" },
      { key: "analytics", label: "Analytics", icon: "↗" },
    ],
  },
  {
    section: "Music",
    items: [
      { key: "smartlinks", label: "SmartLinks", icon: "⊕" },
      { key: "releases", label: "Releases", icon: "◎" },
      { key: "epk", label: "EPK", icon: "✦" },
    ],
  },
  {
    section: "Money",
    items: [
      { key: "payouts", label: "Payouts", icon: "₵" },
      { key: "promo", label: "Promo Planner", icon: "◉" },
    ],
  },
];

// Settings isn't in the nav list; it opens from the artist pill.
export const PAGE_TITLES = {
  ...Object.fromEntries(DASHBOARD_NAV.flatMap((s) => s.items.map((i) => [i.key, i.label]))),
  settings: "Account & Billing",
};

export function initialsFor(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export function DashboardSidebar({
  page,
  open,
  onNavigate,
  onClose,
  linkCount,
  artistName,
  planLabel,
  isPro,
  onLogout,
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-[220px] shrink-0 flex flex-col bg-base-card border-r border-base-border pt-6 transition-transform duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Dashboard navigation"
      >
        <Link href="/" className="flex items-center gap-2 px-5 mb-6">
          <DroppaFmMark size={28} className="rounded-lg" />
          <span className="font-extrabold text-lg tracking-tight">Droppa.fm</span>
        </Link>

        <nav className="flex-1 overflow-y-auto">
          {DASHBOARD_NAV.map((section) => (
            <div key={section.section}>
              <div className="px-5 pt-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-base-muted">
                {section.section}
              </div>
              {section.items.map((item) => {
                const active = page === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onNavigate(item.key)}
                    aria-current={active ? "page" : undefined}
                    className={`w-full flex items-center gap-2.5 px-5 py-2 text-sm border-l-2 transition text-left ${
                      active
                        ? "border-brand bg-base-bg text-fg font-semibold"
                        : "border-transparent text-base-muted font-medium hover:text-fg hover:bg-base-bg"
                    }`}
                  >
                    <span className="w-5 text-center text-base" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.label}
                    {item.key === "smartlinks" && linkCount > 0 && (
                      <span className="ml-auto bg-brand text-white text-[10px] font-extrabold rounded-full px-2 py-px">
                        {linkCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-base-border px-5 py-4 space-y-3">
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className={`w-full flex items-center gap-2.5 text-left rounded-lg -mx-1 px-1 py-1 transition hover:bg-base-bg ${
              page === "settings" ? "bg-base-bg" : ""
            }`}
            title="Account & billing"
          >
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-[#ff8c00] flex items-center justify-center text-white text-sm font-extrabold shrink-0">
              {initialsFor(artistName)}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold truncate">{artistName}</span>
              <span
                className={`block text-xs font-semibold ${isPro ? "text-brand" : "text-base-muted"}`}
              >
                {planLabel}
                {isPro ? " ✦" : ""}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-base-muted hover:text-fg transition"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

export function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

// Placeholder for pages on the roadmap that aren't built yet.
export function ComingSoon({ icon, title, children }) {
  return (
    <div className="glass-card rounded-xl2 text-center px-5 py-16 text-base-muted">
      <div className="text-4xl mb-3" aria-hidden="true">
        {icon}
      </div>
      <div className="text-lg font-bold text-fg mb-1.5">{title}</div>
      <p className="text-sm max-w-sm mx-auto">{children}</p>
      <span className="inline-block mt-5 text-[11px] font-bold uppercase tracking-wide border border-base-border rounded-full px-3 py-1">
        Coming soon
      </span>
    </div>
  );
}
