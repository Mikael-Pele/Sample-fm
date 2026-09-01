import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

const PAYSTACK_PLAN_URL =
  process.env.NEXT_PUBLIC_PAYSTACK_PLAN_URL || "https://paystack.com/pay/sample-fm-premium";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

const EMPTY_FORM = {
  artist_name: "",
  track_title: "",
  artwork_url: "",
  release_date: "",
  is_presave: false,
  url_audiomack: "",
  url_boomplay: "",
  url_spotify: "",
  url_apple: "",
  url_youtube: "",
  pixel_fb: "",
  pixel_tiktok: "",
};

function PlatformInput({ label, name, value, onChange, placeholder, accent }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-semibold text-base-muted mb-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
        {label}
      </label>
      <input
        type="url"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
      />
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="text-base-muted text-xs font-semibold uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-2xl font-extrabold text-white">{value}</div>
    </div>
  );
}

export default function Dashboard({ initialUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [form, setForm] = useState(EMPTY_FORM);
  const [links, setLinks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [droppedFieldsNotice, setDroppedFieldsNotice] = useState([]);
  const [customDomainInput, setCustomDomainInput] = useState(user?.custom_domain || "");
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainError, setDomainError] = useState("");

  const isPro = Boolean(user?.is_pro);

  const loadLinks = useCallback(async () => {
    const res = await fetch("/api/links/list");
    if (res.ok) {
      const data = await res.json();
      setLinks(data.smartlinks || []);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    const res = await fetch("/api/analytics/summary");
    if (res.ok) {
      const data = await res.json();
      setAnalytics(data);
    }
  }, []);

  useEffect(() => {
    loadLinks();
    loadAnalytics();
  }, [loadLinks, loadAnalytics]);

  function handleFieldChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleCreateLink(e) {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setDroppedFieldsNotice([]);
    setCreating(true);

    try {
      const res = await fetch("/api/links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Could not create SmartLink.");
        setCreating(false);
        return;
      }

      setCreateSuccess(`SmartLink created: ${APP_URL}/${data.smartlink.slug}`);
      if (data.dropped_fields && data.dropped_fields.length > 0) {
        setDroppedFieldsNotice(data.dropped_fields);
      }
      setForm(EMPTY_FORM);
      loadLinks();
      loadAnalytics();
    } catch (err) {
      setCreateError("Network error while creating SmartLink.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSimulateUpgrade() {
    const res = await fetch("/api/dev/simulate-upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pro: !isPro }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  }

  async function handleSaveDomain(e) {
    e.preventDefault();
    setDomainError("");
    setDomainSaving(true);
    try {
      const res = await fetch("/api/user/update-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_domain: customDomainInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDomainError(data.error || "Could not save custom domain.");
      } else {
        setUser(data.user);
      }
    } catch (err) {
      setDomainError("Network error while saving custom domain.");
    } finally {
      setDomainSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-base-bg text-white">
      <header className="border-b border-base-border sticky top-0 bg-base-bg/95 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-black text-sm">
              S
            </div>
            <span className="font-bold text-lg">Sample.fm</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-base-muted hidden sm:inline">{user?.email}</span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isPro ? "bg-brand text-white" : "bg-base-card text-base-muted border border-base-border"
              }`}
            >
              {isPro ? "PREMIUM" : "FREE"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-base-muted hover:text-white transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* ---------------- Billing Component ---------------- */}
        <section className="glass-card rounded-xl2 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="text-xs font-semibold text-base-muted uppercase tracking-wide mb-1">
                Account Tier
              </div>
              <div className="text-2xl font-extrabold mb-1">
                {isPro ? "Premium — $16/mo" : "Free Tier"}
              </div>
              <p className="text-sm text-base-muted max-w-md">
                {isPro
                  ? "Retargeting pixels, custom domains, and zero Sample.fm branding are unlocked on your links."
                  : "Unlimited basic SmartLinks with the Sample.fm badge. Upgrade to unlock retargeting pixels and custom domains."}
              </p>
            </div>
            <div className="flex flex-col gap-3 items-stretch md:items-end">
              {!isPro && (
                <a
                  href={PAYSTACK_PLAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand hover:bg-brand-dark transition text-white font-semibold rounded-lg px-6 py-3 text-sm text-center"
                >
                  Upgrade to Premium — $16/mo
                </a>
              )}
              <button
                type="button"
                onClick={handleSimulateUpgrade}
                className="text-xs text-base-muted hover:text-brand-light border border-dashed border-base-border hover:border-brand-light rounded-lg px-4 py-2 transition"
              >
                {isPro
                  ? "[Revert to Free — dev testing]"
                  : "[Simulate Paystack $16 Subscription Success]"}
              </button>
            </div>
          </div>

          {isPro && (
            <form onSubmit={handleSaveDomain} className="mt-6 pt-6 border-t border-base-border flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-base-muted mb-1.5">
                  Custom Domain
                </label>
                <input
                  type="text"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  placeholder="links.myartistbrand.com"
                  className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                />
              </div>
              <button
                type="submit"
                disabled={domainSaving}
                className="bg-base-card border border-base-border hover:border-brand transition text-white font-semibold rounded-lg px-5 py-2.5 text-sm disabled:opacity-60"
              >
                {domainSaving ? "Saving…" : "Save Domain"}
              </button>
            </form>
          )}
          {domainError && <p className="text-sm text-red-400 mt-2">{domainError}</p>}
        </section>

        {/* ---------------- Analytics Panel ---------------- */}
        <section>
          <h2 className="text-lg font-bold mb-4">Analytics</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatTile label="Total Clicks" value={analytics ? analytics.total_clicks : "—"} />
            <StatTile
              label="Top Platform"
              value={analytics && analytics.top_platform ? analytics.top_platform : "—"}
            />
            <StatTile
              label="Top Country"
              value={analytics && analytics.top_country ? analytics.top_country : "—"}
            />
            <StatTile
              label="Pre-Saves Collected"
              value={analytics ? analytics.presaves.length : "—"}
            />
          </div>

          <div className="glass-card rounded-xl2 overflow-hidden">
            <div className="px-5 py-4 border-b border-base-border font-semibold text-sm">
              Fan Emails Collected via Pre-Saves
            </div>
            <div className="max-h-72 overflow-y-auto">
              {analytics && analytics.presaves.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-base-muted text-xs uppercase tracking-wide">
                      <th className="px-5 py-2 font-semibold">Fan Email</th>
                      <th className="px-5 py-2 font-semibold">Track</th>
                      <th className="px-5 py-2 font-semibold">Provider</th>
                      <th className="px-5 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.presaves.map((p) => (
                      <tr key={p.id} className="border-t border-base-border/60">
                        <td className="px-5 py-2.5">{p.fan_email}</td>
                        <td className="px-5 py-2.5 text-base-muted">
                          {p.artist_name} — {p.track_title}
                        </td>
                        <td className="px-5 py-2.5 text-base-muted">{p.provider}</td>
                        <td className="px-5 py-2.5">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              p.processed
                                ? "bg-emerald-950 text-emerald-400"
                                : "bg-amber-950 text-amber-400"
                            }`}
                          >
                            {p.processed ? "Delivered" : "Queued"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-5 py-8 text-center text-base-muted text-sm">
                  No pre-saves collected yet.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---------------- Create SmartLink Form ---------------- */}
        <section className="grid lg:grid-cols-5 gap-8">
          <form onSubmit={handleCreateLink} className="lg:col-span-3 glass-card rounded-xl2 p-6 space-y-6">
            <h2 className="text-lg font-bold">Create a New SmartLink</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">
                  Artist Name
                </label>
                <input
                  type="text"
                  name="artist_name"
                  required
                  value={form.artist_name}
                  onChange={handleFieldChange}
                  placeholder="e.g. Ayra Starr"
                  className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">
                  Track / Album Title
                </label>
                <input
                  type="text"
                  name="track_title"
                  required
                  value={form.track_title}
                  onChange={handleFieldChange}
                  placeholder="e.g. Rush"
                  className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5">
                Artwork URL
              </label>
              <input
                type="url"
                name="artwork_url"
                required
                value={form.artwork_url}
                onChange={handleFieldChange}
                placeholder="https://cdn.example.com/artwork.jpg"
                className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">
                  Release Date
                </label>
                <input
                  type="date"
                  name="release_date"
                  required
                  value={form.release_date}
                  onChange={handleFieldChange}
                  className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                />
              </div>
              <label className="flex items-center gap-2.5 text-sm bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5">
                <input
                  type="checkbox"
                  name="is_presave"
                  checked={form.is_presave}
                  onChange={handleFieldChange}
                  className="w-4 h-4 accent-brand"
                />
                Treat as Pre-Save (unreleased)
              </label>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-base-muted uppercase tracking-wide">
                African Market Multi-Platform URL Grid
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <PlatformInput
                  label="Audiomack"
                  name="url_audiomack"
                  value={form.url_audiomack}
                  onChange={handleFieldChange}
                  placeholder="https://audiomack.com/..."
                  accent="#FFA200"
                />
                <PlatformInput
                  label="Boomplay"
                  name="url_boomplay"
                  value={form.url_boomplay}
                  onChange={handleFieldChange}
                  placeholder="https://boomplay.com/..."
                  accent="#F3D93A"
                />
                <PlatformInput
                  label="Spotify"
                  name="url_spotify"
                  value={form.url_spotify}
                  onChange={handleFieldChange}
                  placeholder="https://open.spotify.com/..."
                  accent="#1DB954"
                />
                <PlatformInput
                  label="Apple Music"
                  name="url_apple"
                  value={form.url_apple}
                  onChange={handleFieldChange}
                  placeholder="https://music.apple.com/..."
                  accent="#FA243C"
                />
                <PlatformInput
                  label="YouTube Music"
                  name="url_youtube"
                  value={form.url_youtube}
                  onChange={handleFieldChange}
                  placeholder="https://music.youtube.com/..."
                  accent="#FF0000"
                />
              </div>
            </div>

            {/* ---------------- Strict 2-Tier Product Gate ---------------- */}
            <div className="relative">
              <h3 className="text-sm font-bold mb-3 text-base-muted uppercase tracking-wide">
                Advanced Retargeting &amp; Branding (Premium)
              </h3>
              <div className={`grid sm:grid-cols-2 gap-4 ${!isPro ? "gate-blur" : ""}`}>
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">
                    Facebook Pixel ID
                  </label>
                  <input
                    type="text"
                    name="pixel_fb"
                    value={form.pixel_fb}
                    onChange={handleFieldChange}
                    disabled={!isPro}
                    placeholder="1234567890123456"
                    className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">
                    TikTok Pixel ID
                  </label>
                  <input
                    type="text"
                    name="pixel_tiktok"
                    value={form.pixel_tiktok}
                    onChange={handleFieldChange}
                    disabled={!isPro}
                    placeholder="C4A1B2C3D4E5F6G7H8I9"
                    className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                  />
                </div>
              </div>

              {!isPro && (
                <div className="absolute inset-0 top-8 flex flex-col items-center justify-center bg-base-card/70 rounded-xl border border-dashed border-base-border animate-fade-in">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mb-2 text-brand-light">
                    <path
                      d="M6 10V8a6 6 0 1112 0v2M5 10h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-sm font-semibold mb-2">Unlock with Premium — $16/mo</p>
                  <a
                    href={PAYSTACK_PLAN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand hover:bg-brand-dark transition text-white text-xs font-semibold rounded-lg px-4 py-2"
                  >
                    Upgrade Now
                  </a>
                </div>
              )}
            </div>

            {createError && (
              <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2 break-all">
                {createSuccess}
              </div>
            )}
            {droppedFieldsNotice.length > 0 && (
              <div className="text-sm text-amber-400 bg-amber-950/40 border border-amber-900 rounded-lg px-3 py-2">
                Free tier: {droppedFieldsNotice.join(", ")} were not saved. Upgrade to Premium to
                enable them.
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 transition text-white font-semibold rounded-lg py-3 text-sm"
            >
              {creating ? "Creating…" : "Create SmartLink"}
            </button>
          </form>

          {/* ---------------- SmartLinks List ---------------- */}
          <div className="lg:col-span-2 glass-card rounded-xl2 p-6">
            <h2 className="text-lg font-bold mb-4">Your SmartLinks</h2>
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {links.length === 0 && (
                <p className="text-sm text-base-muted">
                  You haven&apos;t created any SmartLinks yet.
                </p>
              )}
              {links.map((link) => (
                <a
                  key={link.id}
                  href={`/${link.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-base-bg border border-base-border rounded-lg p-3.5 hover:border-brand transition"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={link.artwork_url}
                      alt={link.track_title}
                      className="w-12 h-12 rounded-md object-cover bg-base-card flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{link.track_title}</div>
                      <div className="text-xs text-base-muted truncate">{link.artist_name}</div>
                      <div className="text-xs text-brand-light truncate">
                        {APP_URL || "sample.fm"}/{link.slug}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-base-muted">
                    <span>{link._count?.analytics ?? 0} clicks</span>
                    <span>{link._count?.presaves ?? 0} pre-saves</span>
                    {link.is_presave && (
                      <span className="text-amber-400 font-semibold">PRE-SAVE</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
