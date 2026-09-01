import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import {
  AudiomackIcon,
  BoomplayIcon,
  SpotifyIcon,
  AppleMusicIcon,
  YouTubeMusicIcon,
  UploadIcon,
  LockIcon,
} from "./PlatformIcons";

const PAYSTACK_PLAN_URL =
  process.env.NEXT_PUBLIC_PAYSTACK_PLAN_URL || "https://paystack.com/pay/sample-fm-premium";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

const EMPTY_FORM = {
  artist_name: "",
  track_title: "",
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

const PLATFORM_FIELDS = [
  { key: "url_audiomack", label: "Audiomack", Icon: AudiomackIcon, ring: "focus-within:ring-audiomack" },
  { key: "url_boomplay", label: "Boomplay", Icon: BoomplayIcon, ring: "focus-within:ring-boomplay" },
  { key: "url_spotify", label: "Spotify", Icon: SpotifyIcon, ring: "focus-within:ring-spotify" },
  { key: "url_apple", label: "Apple Music", Icon: AppleMusicIcon, ring: "focus-within:ring-apple" },
  { key: "url_youtube", label: "YouTube Music", Icon: YouTubeMusicIcon, ring: "focus-within:ring-youtube" },
];

function PlatformInput({ field, value, onChange }) {
  const { key, label, Icon, ring } = field;
  return (
    <div className="flex items-center gap-3">
      {/* Logo lives in its own large, separate tile — not squeezed inside
          the input field. */}
      <div className="w-14 h-14 rounded-xl bg-base-bg border border-base-border flex items-center justify-center shrink-0">
        <Icon size={40} />
      </div>
      <div
        className={`min-w-0 flex-1 bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 transition focus-within:border-brand focus-within:ring-1 ${ring}`}
      >
        <label htmlFor={key} className="block text-[11px] font-semibold text-base-muted mb-0.5">
          {label}
        </label>
        <input
          id={key}
          type="url"
          name={key}
          value={value}
          onChange={onChange}
          placeholder={`https://${label.toLowerCase().replace(/\s/g, "")}.com/...`}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-base-muted/60"
        />
      </div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 min-w-0">
      <div className="text-base-muted text-xs font-semibold uppercase tracking-wide mb-2 truncate">
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-extrabold text-white truncate">{value}</div>
    </div>
  );
}

const MAX_ARTWORK_BYTES = 6 * 1024 * 1024; // 6MB, matches the server-side cap
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

let artworkItemSeq = 0;
function nextArtworkItemId() {
  artworkItemSeq += 1;
  return `art-${Date.now()}-${artworkItemSeq}`;
}

export default function Dashboard({ initialUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [form, setForm] = useState(EMPTY_FORM);
  // Each item: { id, previewUrl (local, instant), url (final hosted URL
  // once uploaded), uploading, error, source: "upload" | "url" }
  const [artworkItems, setArtworkItems] = useState([]);
  const [manualUrlOpen, setManualUrlOpen] = useState(false);
  const [manualUrlValue, setManualUrlValue] = useState("");
  const fileInputRef = useRef(null);
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

  function updateArtworkItem(id, patch) {
    setArtworkItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function uploadArtworkFile(file) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      window.alert(`${file.name}: unsupported file type. Use JPG, PNG, WEBP, or GIF.`);
      return;
    }
    if (file.size > MAX_ARTWORK_BYTES) {
      window.alert(`${file.name}: file is too large. Max size is 6MB.`);
      return;
    }

    const id = nextArtworkItemId();
    const previewUrl = URL.createObjectURL(file);

    setArtworkItems((prev) => [
      ...prev,
      { id, previewUrl, url: null, uploading: true, error: null, source: "upload" },
    ]);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await fetch("/api/upload/artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data_url: dataUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        updateArtworkItem(id, { uploading: false, error: data.error || "Upload failed." });
        return;
      }

      updateArtworkItem(id, { uploading: false, url: data.url, error: null });
    } catch (err) {
      updateArtworkItem(id, { uploading: false, error: "Network error during upload." });
    }
  }

  function handleFilesSelected(fileList) {
    const files = Array.from(fileList || []);
    files.forEach((file) => uploadArtworkFile(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  }

  function addManualUrl() {
    const trimmed = manualUrlValue.trim();
    if (!trimmed) return;
    setArtworkItems((prev) => [
      ...prev,
      {
        id: nextArtworkItemId(),
        previewUrl: trimmed,
        url: trimmed,
        uploading: false,
        error: null,
        source: "url",
      },
    ]);
    setManualUrlValue("");
    setManualUrlOpen(false);
  }

  function removeArtworkItem(id) {
    setArtworkItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item && item.source === "upload" && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }

  async function handleCreateLink(e) {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setDroppedFieldsNotice([]);

    if (artworkItems.some((item) => item.uploading)) {
      setCreateError("Please wait for cover art uploads to finish.");
      return;
    }

    const cleanGallery = artworkItems.map((item) => item.url).filter(Boolean);

    if (cleanGallery.length === 0) {
      setCreateError("Please add at least one cover image.");
      return;
    }

    setCreating(true);

    try {
      const res = await fetch("/api/links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          artwork_url: cleanGallery[0] || "",
          artwork_urls: cleanGallery,
        }),
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
      setArtworkItems([]);
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
      loadAnalytics();
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

  function exportEmailsCsv() {
    if (!analytics || !analytics.presaves || analytics.presaves.length === 0) return;
    const header = "fan_email,track_title,artist_name,provider,status,collected_at\n";
    const rows = analytics.presaves
      .map((p) =>
        [
          p.fan_email,
          `"${p.track_title.replace(/"/g, '""')}"`,
          `"${p.artist_name.replace(/"/g, '""')}"`,
          p.provider,
          p.processed ? "Delivered" : "Queued",
          new Date(p.created_at).toISOString(),
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-fm-fan-emails.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="relative min-h-screen bg-base-bg text-white overflow-x-hidden">
      <div className="light-streaks" aria-hidden="true" />
      <header className="border-b border-base-border sticky top-0 bg-base-bg/95 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-black text-sm text-base-bg shrink-0">
              S
            </div>
            <span className="font-bold text-lg truncate">Sample.fm</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="text-sm text-base-muted hidden md:inline truncate max-w-[180px]">
              {user?.email}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                isPro ? "bg-brand text-base-bg" : "bg-base-card text-base-muted border border-base-border"
              }`}
            >
              {isPro ? "PREMIUM" : "FREE"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-base-muted hover:text-white transition whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 sm:space-y-10">
        {/* ---------------- Billing Component ---------------- */}
        <section className="glass-card rounded-xl2 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-base-muted uppercase tracking-wide mb-1">
                Account Tier
              </div>
              <div className="text-xl sm:text-2xl font-extrabold mb-1">
                {isPro ? "Premium — $16/mo" : "Free Tier"}
              </div>
              <p className="text-sm text-base-muted max-w-md">
                {isPro
                  ? "Retargeting pixels, custom domains, fan email exports, and zero Sample.fm branding are unlocked on your links."
                  : "Unlimited basic SmartLinks with the Sample.fm badge. Upgrade to unlock retargeting pixels, custom domains, and your fan email database."}
              </p>
            </div>
            <div className="flex flex-col gap-3 items-stretch md:items-end shrink-0">
              {!isPro && (
                <a
                  href={PAYSTACK_PLAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ "--glow-color": "rgba(255, 77, 0, 0.5)" }}
                  className="shimmer-gold glow-on-hover text-base-bg font-bold rounded-lg px-6 py-3 text-sm text-center"
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
            <form
              onSubmit={handleSaveDomain}
              className="mt-6 pt-6 border-t border-base-border flex flex-col sm:flex-row gap-3 items-start sm:items-end"
            >
              <div className="flex-1 w-full min-w-0">
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
                className="w-full sm:w-auto bg-base-card border border-base-border hover:border-brand transition text-white font-semibold rounded-lg px-5 py-2.5 text-sm disabled:opacity-60"
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
              value={analytics ? analytics.presave_count : "—"}
            />
          </div>

          <div className="glass-card rounded-xl2 overflow-hidden relative">
            <div className="px-4 sm:px-5 py-4 border-b border-base-border font-semibold text-sm flex items-center justify-between gap-3">
              <span>Fan Emails Collected via Pre-Saves</span>
              {isPro && analytics && analytics.presaves.length > 0 && (
                <button
                  type="button"
                  onClick={exportEmailsCsv}
                  className="text-xs font-semibold text-brand-light hover:text-brand transition whitespace-nowrap"
                >
                  Export CSV
                </button>
              )}
            </div>

            {analytics && analytics.presaves_locked ? (
              <div className="px-4 sm:px-5 py-10 relative">
                <div className="gate-blur select-none pointer-events-none">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-base-muted text-xs uppercase tracking-wide">
                        <th className="px-2 py-2 font-semibold">Fan Email</th>
                        <th className="px-2 py-2 font-semibold">Track</th>
                        <th className="px-2 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3].map((i) => (
                        <tr key={i} className="border-t border-base-border/60">
                          <td className="px-2 py-2.5">fan{i}@example.com</td>
                          <td className="px-2 py-2.5 text-base-muted">Sample Track {i}</td>
                          <td className="px-2 py-2.5 text-emerald-400">Queued</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-card/85 px-6 text-center">
                  <LockIcon className="text-brand mb-3" />
                  <p className="text-sm font-semibold text-white mb-1">
                    {analytics.presave_count} pre-save{analytics.presave_count === 1 ? "" : "s"}{" "}
                    collected
                  </p>
                  <p className="text-sm text-base-muted mb-4 max-w-xs">
                    Upgrade to Premium ($16/mo) to unlock, view, and export your fan email
                    database.
                  </p>
                  <a
                    href={PAYSTACK_PLAN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand hover:bg-brand-dark transition text-base-bg text-xs font-bold rounded-lg px-4 py-2"
                  >
                    Upgrade Now
                  </a>
                </div>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto overflow-x-auto">
                {analytics && analytics.presaves.length > 0 ? (
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="text-left text-base-muted text-xs uppercase tracking-wide">
                        <th className="px-4 sm:px-5 py-2 font-semibold">Fan Email</th>
                        <th className="px-4 sm:px-5 py-2 font-semibold">Track</th>
                        <th className="px-4 sm:px-5 py-2 font-semibold">Provider</th>
                        <th className="px-4 sm:px-5 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.presaves.map((p) => (
                        <tr key={p.id} className="border-t border-base-border/60">
                          <td className="px-4 sm:px-5 py-2.5 whitespace-nowrap">{p.fan_email}</td>
                          <td className="px-4 sm:px-5 py-2.5 text-base-muted whitespace-nowrap">
                            {p.artist_name} — {p.track_title}
                          </td>
                          <td className="px-4 sm:px-5 py-2.5 text-base-muted">{p.provider}</td>
                          <td className="px-4 sm:px-5 py-2.5">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
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
            )}
          </div>
        </section>

        {/* ---------------- Create SmartLink Form ---------------- */}
        <section className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          <form
            onSubmit={handleCreateLink}
            className="lg:col-span-3 glass-card rounded-xl2 p-5 sm:p-6 space-y-6 min-w-0"
          >
            <h2 className="text-lg font-bold">Create a New SmartLink</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-base-muted mb-1.5">
                  Artist Name
                </label>
                <input
                  type="text"
                  name="artist_name"
                  required
                  value={form.artist_name}
                  onChange={handleFieldChange}
                  placeholder="e.g. Kofi Solar"
                  className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-base-muted mb-1.5">
                  Track / Album Title
                </label>
                <input
                  type="text"
                  name="track_title"
                  required
                  value={form.track_title}
                  onChange={handleFieldChange}
                  placeholder="e.g. Golden Hour"
                  className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                />
              </div>
            </div>

            {/* ---------------- Cover Art Upload ---------------- */}
            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5">
                Cover Art (one or more images — the first is the banner)
              </label>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-base-border hover:border-brand rounded-xl px-4 py-8 text-center transition"
              >
                <UploadIcon className="text-base-muted" />
                <p className="text-sm font-semibold text-white">
                  Drag &amp; drop images, or click to browse
                </p>
                <p className="text-xs text-base-muted">JPG, PNG, WEBP, or GIF — up to 6MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                />
              </div>

              {artworkItems.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                  {artworkItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-base-bg border border-base-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt=""
                        className={`w-full h-full object-cover ${
                          item.uploading ? "opacity-40" : ""
                        }`}
                      />
                      {index === 0 && !item.uploading && !item.error && (
                        <span className="absolute top-1 left-1 bg-brand text-base-bg text-[10px] font-bold px-1.5 py-0.5 rounded">
                          BANNER
                        </span>
                      )}
                      {item.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-white bg-black/60 px-2 py-1 rounded">
                            Uploading…
                          </span>
                        </div>
                      )}
                      {item.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 px-1">
                          <span className="text-[10px] font-semibold text-red-300 text-center">
                            {item.error}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeArtworkItem(item.id)}
                        aria-label="Remove image"
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/70 text-white text-xs hover:bg-red-600 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!manualUrlOpen ? (
                <button
                  type="button"
                  onClick={() => setManualUrlOpen(true)}
                  className="mt-2 text-xs font-semibold text-brand-light hover:text-brand transition"
                >
                  or paste an image URL instead
                </button>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={manualUrlValue}
                    onChange={(e) => setManualUrlValue(e.target.value)}
                    placeholder="https://cdn.example.com/artwork.jpg"
                    className="flex-1 min-w-0 bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                  />
                  <button
                    type="button"
                    onClick={addManualUrl}
                    className="bg-base-card border border-base-border hover:border-brand transition text-white font-semibold rounded-lg px-4 py-2.5 text-sm shrink-0"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <div className="min-w-0">
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
              <label className="flex items-center gap-2.5 text-sm bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 min-w-0">
                <input
                  type="checkbox"
                  name="is_presave"
                  checked={form.is_presave}
                  onChange={handleFieldChange}
                  className="w-4 h-4 accent-brand shrink-0"
                />
                <span className="truncate">Treat as Pre-Save (unreleased)</span>
              </label>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-base-muted uppercase tracking-wide">
                Multi-Platform Streaming Grid
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {PLATFORM_FIELDS.map((field) => (
                  <PlatformInput
                    key={field.key}
                    field={field}
                    value={form[field.key]}
                    onChange={handleFieldChange}
                  />
                ))}
              </div>
            </div>

            {/* ---------------- Strict 2-Tier Product Gate ---------------- */}
            <div className="relative">
              <h3 className="text-sm font-bold mb-3 text-base-muted uppercase tracking-wide">
                Advanced Retargeting &amp; Branding (Premium)
              </h3>
              <div className={`grid sm:grid-cols-2 gap-4 ${!isPro ? "gate-blur" : ""}`}>
                <div className="min-w-0">
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
                <div className="min-w-0">
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
                <div className="absolute inset-0 top-8 flex flex-col items-center justify-center bg-base-card/75 rounded-xl border border-dashed border-base-border animate-fade-in px-4 text-center">
                  <LockIcon className="text-brand mb-2" />
                  <p className="text-sm font-semibold mb-2">Unlock with Premium — $16/mo</p>
                  <a
                    href={PAYSTACK_PLAN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand hover:bg-brand-dark transition text-base-bg text-xs font-bold rounded-lg px-4 py-2"
                  >
                    Upgrade Now
                  </a>
                </div>
              )}
            </div>

            {createError && (
              <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2 break-words">
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
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 transition text-base-bg font-bold rounded-lg py-3 text-sm"
            >
              {creating ? "Creating…" : "Create SmartLink"}
            </button>
          </form>

          {/* ---------------- SmartLinks List ---------------- */}
          <div className="lg:col-span-2 glass-card rounded-xl2 p-5 sm:p-6 min-w-0">
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
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={link.artwork_url}
                      alt={link.track_title}
                      className="w-12 h-12 rounded-md object-cover bg-base-card shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{link.track_title}</div>
                      <div className="text-xs text-base-muted truncate">{link.artist_name}</div>
                      <div className="text-xs text-brand-light truncate">
                        {APP_URL || "sample.fm"}/{link.slug}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-base-muted flex-wrap">
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
