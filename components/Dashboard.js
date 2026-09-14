import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  AudiomackIcon,
  BoomplayIcon,
  SpotifyIcon,
  AppleMusicIcon,
  YouTubeMusicIcon,
  DeezerIcon,
  TidalIcon,
  SoundCloudIcon,
  PandoraIcon,
  IHeartRadioIcon,
  WhatsAppIcon,
  CommunityIcon,
  UploadIcon,
  LockIcon,
  DroppaFmMark,
} from "./PlatformIcons";
import SiteFooter from "./SiteFooter";
import { ReportProblemTrigger } from "./ReportProblemModal";
import { FREE_TIER_LINK_LIMIT, REGION_PRICING } from "../lib/plans";

// Shown only to Premium subscribers as a direct line for support — a perk
// of paying, not something free-tier users see.
const PREMIUM_SUPPORT_PHONE_DISPLAY = "+64 635253254";
const PREMIUM_SUPPORT_WHATSAPP_URL = "https://wa.me/64635253254";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

// A single "upgrade now" link for the small in-context gates scattered
// through the form (pixels, locked analytics, etc.) — they send people to
// the plan picker in the billing panel rather than guessing.
const UPGRADE_ANCHOR = "#billing";

const PLAN_DISPLAY = {
  free: "Free",
  premium: "Premium",
};

const EMPTY_FORM = {
  artist_name: "",
  track_title: "",
  custom_slug: "",
  release_date: "",
  is_presave: false,
  url_audiomack: "",
  url_boomplay: "",
  url_spotify: "",
  url_apple: "",
  url_youtube: "",
  url_deezer: "",
  url_tidal: "",
  url_soundcloud: "",
  url_pandora: "",
  url_iheartradio: "",
  url_whatsapp: "",
  community_url: "",
  community_label: "",
  pixel_fb: "",
  pixel_tiktok: "",
};

const PLATFORM_FIELDS = [
  { key: "url_audiomack", label: "Audiomack", Icon: AudiomackIcon, ring: "focus-within:ring-audiomack" },
  { key: "url_boomplay", label: "Boomplay", Icon: BoomplayIcon, ring: "focus-within:ring-boomplay" },
  { key: "url_spotify", label: "Spotify", Icon: SpotifyIcon, ring: "focus-within:ring-spotify" },
  { key: "url_apple", label: "Apple Music", Icon: AppleMusicIcon, ring: "focus-within:ring-apple" },
  { key: "url_youtube", label: "YouTube Music", Icon: YouTubeMusicIcon, ring: "focus-within:ring-youtube" },
  { key: "url_deezer", label: "Deezer", Icon: DeezerIcon, ring: "focus-within:ring-deezer" },
  { key: "url_tidal", label: "Tidal", Icon: TidalIcon, ring: "focus-within:ring-tidal" },
  { key: "url_soundcloud", label: "SoundCloud", Icon: SoundCloudIcon, ring: "focus-within:ring-soundcloud" },
  { key: "url_pandora", label: "Pandora", Icon: PandoraIcon, ring: "focus-within:ring-pandora" },
  { key: "url_iheartradio", label: "iHeartRadio", Icon: IHeartRadioIcon, ring: "focus-within:ring-iheartradio" },
  { key: "url_whatsapp", label: "WhatsApp Channel", Icon: WhatsAppIcon, ring: "focus-within:ring-whatsapp" },
];

// Display metadata for the per-platform click breakdown (Premium). Keyed
// by the `platform_clicked` values written by /api/analytics/track.
const PLATFORM_META = {
  audiomack: { label: "Audiomack", Icon: AudiomackIcon, barClass: "bg-audiomack" },
  boomplay: { label: "Boomplay", Icon: BoomplayIcon, barClass: "bg-boomplay" },
  spotify: { label: "Spotify", Icon: SpotifyIcon, barClass: "bg-spotify" },
  apple: { label: "Apple Music", Icon: AppleMusicIcon, barClass: "bg-apple" },
  youtube: { label: "YouTube Music", Icon: YouTubeMusicIcon, barClass: "bg-youtube" },
  deezer: { label: "Deezer", Icon: DeezerIcon, barClass: "bg-deezer" },
  tidal: { label: "Tidal", Icon: TidalIcon, barClass: "bg-base-muted" },
  soundcloud: { label: "SoundCloud", Icon: SoundCloudIcon, barClass: "bg-soundcloud" },
  pandora: { label: "Pandora", Icon: PandoraIcon, barClass: "bg-pandora" },
  iheartradio: { label: "iHeartRadio", Icon: IHeartRadioIcon, barClass: "bg-iheartradio" },
  whatsapp: { label: "WhatsApp Channel", Icon: WhatsAppIcon, barClass: "bg-whatsapp" },
  community_cta: { label: "Fan Community CTA", Icon: CommunityIcon, barClass: "bg-brand" },
  presave: { label: "Pre-Save Modal", Icon: UploadIcon, barClass: "bg-brand" },
  footer_cta: { label: "\"Powered by\" Footer", Icon: UploadIcon, barClass: "bg-base-muted" },
};

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

export default function Dashboard({ initialUser, pricingRegion: detectedRegion }) {
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
  const [deletingId, setDeletingId] = useState(null);
  const [billingInterval, setBillingInterval] = useState("monthly");
  // Auto-detected from IP geo, but a visitor can override it (VPNs, travel,
  // misdetection) — a quiet toggle, not a big region picker.
  const [pricingRegion, setPricingRegion] = useState(detectedRegion === "africa" ? "africa" : "global");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

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

    if (name === "custom_slug") {
      // Sanitize as-you-type: lowercase, spaces/underscores become hyphens,
      // strip anything that isn't a-z, 0-9, or a hyphen — mirrors how the
      // link will actually look, e.g. "Catch The Feeling" -> "catch-the-feeling".
      const sanitized = value
        .toLowerCase()
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");
      setForm((prev) => ({ ...prev, custom_slug: sanitized }));
      return;
    }

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

  async function handleUpgradeClick() {
    setUpgradeError("");
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/billing/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: pricingRegion, billing_interval: billingInterval }),
      });
      const data = await res.json();

      if (!res.ok || !data.authorization_url) {
        setUpgradeError(data.error || "Could not start checkout. Please try again.");
        setUpgradeLoading(false);
        return;
      }

      window.location.href = data.authorization_url;
    } catch (err) {
      setUpgradeError("Network error. Please try again.");
      setUpgradeLoading(false);
    }
  }

  async function handleSimulateUpgrade() {
    const res = await fetch("/api/dev/simulate-upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pro: !isPro, billing_interval: "monthly" }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser((prev) => ({ ...prev, ...data.user }));
      loadAnalytics();
    }
  }

  async function handleDeleteLink(link) {
    const confirmed = window.confirm(
      `Delete "${link.track_title}" by ${link.artist_name}? This permanently removes its analytics and pre-saves too. This can't be undone.`
    );
    if (!confirmed) return;

    setDeletingId(link.id);
    try {
      const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
      if (res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== link.id));
        loadAnalytics();
      } else {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || "Could not delete this SmartLink.");
      }
    } catch (err) {
      window.alert("Network error while deleting this SmartLink.");
    } finally {
      setDeletingId(null);
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
        setUser((prev) => ({ ...prev, ...data.user }));
      }
    } catch (err) {
      setDomainError("Network error while saving custom domain.");
    } finally {
      setDomainSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Could not change your password.");
      } else {
        setPasswordSuccess("Password updated.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err) {
      setPasswordError("Network error. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleResendVerification() {
    setResendMessage("");
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      setResendMessage(res.ok ? data.message || "Sent." : data.error || "Could not send it right now.");
    } catch (err) {
      setResendMessage("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }

  function exportEmailsCsv() {
    if (!analytics || !analytics.presaves || analytics.presaves.length === 0) return;
    const header = "fan_email,fan_phone,track_title,artist_name,provider,status,collected_at\n";
    const rows = analytics.presaves
      .map((p) =>
        [
          p.fan_email,
          p.fan_phone || "",
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
    a.download = "droppa-fm-fan-emails.csv";
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
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <DroppaFmMark size={32} className="rounded-lg" />
            <span className="font-bold text-lg truncate">Droppa.fm</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="text-sm text-base-muted hidden md:inline truncate max-w-[180px]">
              {user?.email}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap uppercase ${
                isPro ? "bg-brand text-base-bg" : "bg-base-card text-base-muted border border-base-border"
              }`}
            >
              {PLAN_DISPLAY[user?.plan] || (isPro ? "Pro" : "Free")}
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
        <section id="billing" className="glass-card rounded-xl2 p-5 sm:p-6 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-base-muted uppercase tracking-wide mb-1">
                Account Tier
              </div>
              <div className="text-xl sm:text-2xl font-extrabold mb-1">
                {isPro ? PLAN_DISPLAY[user?.plan] || "Premium" : "Free Tier"}
              </div>
              <p className="text-sm text-base-muted max-w-md">
                {isPro
                  ? `Unlimited SmartLinks, retargeting pixels, custom domains, fan email exports, and zero Droppa.fm branding are unlocked.${
                      user?.plan_expires_at
                        ? ` Renews ${new Date(user.plan_expires_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}.`
                        : ""
                    }`
                  : `Up to ${FREE_TIER_LINK_LIMIT} SmartLinks with the Droppa.fm badge. Upgrade to unlock unlimited links, retargeting pixels, custom domains, and your fan email database.`}
              </p>
            </div>
            {!IS_PRODUCTION && (
              <button
                type="button"
                onClick={handleSimulateUpgrade}
                className="shrink-0 text-xs text-base-muted hover:text-brand-light border border-dashed border-base-border hover:border-brand-light rounded-lg px-4 py-2 transition"
              >
                {isPro ? "[Revert to Free — dev testing]" : "[Simulate Pro upgrade — dev testing]"}
              </button>
            )}
          </div>

          {!isPro && (
            <div className="space-y-4">
              <div className="inline-flex rounded-lg bg-base-bg border border-base-border p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-3.5 py-1.5 rounded-md transition ${
                    billingInterval === "monthly" ? "bg-brand text-base-bg" : "text-base-muted hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval("yearly")}
                  className={`px-3.5 py-1.5 rounded-md transition ${
                    billingInterval === "yearly" ? "bg-brand text-base-bg" : "text-base-muted hover:text-white"
                  }`}
                >
                  Yearly <span className="opacity-80">(2 months free)</span>
                </button>
              </div>

              <div className="max-w-sm bg-base-bg border-2 border-brand rounded-xl p-5 flex flex-col">
                <div className="font-bold text-sm mb-1">Premium</div>
                <div className="text-2xl font-extrabold mb-1">
                  ${REGION_PRICING[pricingRegion][billingInterval].toFixed(2).replace(/\.00$/, "")}
                  <span className="text-sm font-medium text-base-muted">
                    /{billingInterval === "yearly" ? "yr" : "mo"}
                  </span>
                </div>
                <p className="text-xs text-base-muted mb-4 flex-1">
                  Unlimited SmartLinks, pixels, custom domain, fan email exports, no branding.
                </p>
                {upgradeError ? (
                  <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2 mb-3">
                    {upgradeError}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleUpgradeClick}
                  disabled={upgradeLoading}
                  style={{ "--glow-color": "rgba(255, 77, 0, 0.5)" }}
                  className="w-full shimmer-gold glow-on-hover text-center text-base-bg font-bold rounded-lg py-2.5 text-sm disabled:opacity-60"
                >
                  {upgradeLoading ? "Redirecting to checkout…" : "Upgrade to Premium"}
                </button>
              </div>
            </div>
          )}

          {isPro && (
            <div className="mt-6 pt-6 border-t border-base-border flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <span className="font-semibold text-white">Premium support</span>
              <a
                href={`tel:${PREMIUM_SUPPORT_PHONE_DISPLAY.replace(/\s+/g, "")}`}
                className="text-base-muted hover:text-white transition"
              >
                Call {PREMIUM_SUPPORT_PHONE_DISPLAY}
              </a>
              <a
                href={PREMIUM_SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base-muted hover:text-white transition"
              >
                WhatsApp
              </a>
              <ReportProblemTrigger className="text-base-muted hover:text-white transition" />
            </div>
          )}
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
                  Export CSV (email + phone)
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
                        <th className="px-2 py-2 font-semibold">Phone</th>
                        <th className="px-2 py-2 font-semibold">Track</th>
                        <th className="px-2 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3].map((i) => (
                        <tr key={i} className="border-t border-base-border/60">
                          <td className="px-2 py-2.5">fan{i}@example.com</td>
                          <td className="px-2 py-2.5">+233 24 000 000{i}</td>
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
                    Upgrade to unlock, view, and export your fan email database.
                  </p>
                  <a
                    href={UPGRADE_ANCHOR}
                    className="bg-brand hover:bg-brand-dark transition text-base-bg text-xs font-bold rounded-lg px-4 py-2"
                  >
                    See Plans
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
                        <th className="px-4 sm:px-5 py-2 font-semibold">Phone</th>
                        <th className="px-4 sm:px-5 py-2 font-semibold">Track</th>
                        <th className="px-4 sm:px-5 py-2 font-semibold">Provider</th>
                        <th className="px-4 sm:px-5 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.presaves.map((p) => (
                        <tr key={p.id} className="border-t border-base-border/60">
                          <td className="px-4 sm:px-5 py-2.5 whitespace-nowrap">{p.fan_email}</td>
                          <td className="px-4 sm:px-5 py-2.5 whitespace-nowrap text-base-muted">
                            {p.fan_phone || "—"}
                          </td>
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

          {/* ---------------- Full Platform & Country Breakdown (Premium) ---------------- */}
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="glass-card rounded-xl2 overflow-hidden relative">
              <div className="px-4 sm:px-5 py-4 border-b border-base-border font-semibold text-sm">
                Clicks by Platform
              </div>
              {analytics && analytics.breakdown_locked ? (
                <div className="px-4 sm:px-5 py-8 relative">
                  <div className="gate-blur select-none pointer-events-none space-y-3">
                    {["audiomack", "boomplay", "spotify"].map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs w-20 text-base-muted capitalize">{key}</span>
                        <div className="flex-1 h-2 rounded-full bg-base-bg overflow-hidden">
                          <div className={`h-full w-2/3 ${PLATFORM_META[key].barClass}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-card/85 px-6 text-center">
                    <LockIcon className="text-brand mb-2" />
                    <p className="text-xs text-base-muted max-w-[220px]">
                      <a href={UPGRADE_ANCHOR} className="text-brand-light hover:text-brand">
                        Upgrade
                      </a>{" "}
                      to see clicks broken down by every platform.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-4 sm:px-5 py-4 space-y-3">
                  {analytics && analytics.platform_breakdown.length > 0 ? (
                    analytics.platform_breakdown.map((row) => {
                      const meta = PLATFORM_META[row.platform] || {
                        label: row.platform,
                        barClass: "bg-brand",
                      };
                      const max = analytics.platform_breakdown[0].count || 1;
                      const pct = Math.max(6, Math.round((row.count / max) * 100));
                      return (
                        <div key={row.platform} className="flex items-center gap-2">
                          <span className="text-xs w-28 shrink-0 text-base-muted truncate">
                            {meta.label}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-base-bg overflow-hidden">
                            <div
                              className={`h-full ${meta.barClass}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-white w-8 text-right shrink-0">
                            {row.count}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-base-muted text-center py-4">No clicks yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="glass-card rounded-xl2 overflow-hidden relative">
              <div className="px-4 sm:px-5 py-4 border-b border-base-border font-semibold text-sm">
                Clicks by Country
              </div>
              {analytics && analytics.breakdown_locked ? (
                <div className="px-4 sm:px-5 py-8 relative">
                  <div className="gate-blur select-none pointer-events-none space-y-3">
                    {["NG", "GH", "US"].map((code) => (
                      <div key={code} className="flex items-center gap-2">
                        <span className="text-xs w-20 text-base-muted">{code}</span>
                        <div className="flex-1 h-2 rounded-full bg-base-bg overflow-hidden">
                          <div className="h-full w-1/2 bg-brand" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-card/85 px-6 text-center">
                    <LockIcon className="text-brand mb-2" />
                    <p className="text-xs text-base-muted max-w-[220px]">
                      <a href={UPGRADE_ANCHOR} className="text-brand-light hover:text-brand">
                        Upgrade
                      </a>{" "}
                      to see your full country-by-country breakdown.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-4 sm:px-5 py-4 space-y-3">
                  {analytics && analytics.country_breakdown.length > 0 ? (
                    analytics.country_breakdown.map((row) => {
                      const max = analytics.country_breakdown[0].count || 1;
                      const pct = Math.max(6, Math.round((row.count / max) * 100));
                      return (
                        <div key={row.country} className="flex items-center gap-2">
                          <span className="text-xs w-12 shrink-0 text-base-muted">
                            {row.country}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-base-bg overflow-hidden">
                            <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-white w-8 text-right shrink-0">
                            {row.count}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-base-muted text-center py-4">No clicks yet.</p>
                  )}
                </div>
              )}
            </div>
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

            {/* ---------------- Custom Link ---------------- */}
            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5">
                Custom Link (optional — like ditto.fm/catch-the-feeling)
              </label>
              <div className="flex items-center bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 focus-within:border-brand transition">
                <span className="text-sm text-base-muted whitespace-nowrap">
                  {(APP_URL || "droppa.fm").replace(/^https?:\/\//, "")}/
                </span>
                <input
                  type="text"
                  name="custom_slug"
                  value={form.custom_slug}
                  onChange={handleFieldChange}
                  placeholder="catch-the-feeling"
                  maxLength={60}
                  className="flex-1 min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-base-muted/60"
                />
              </div>
              <p className="text-xs text-base-muted mt-1">
                Leave blank for a random link. Lowercase letters, numbers, and hyphens only.
              </p>
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

            {/* ---------------- Fan Community CTA ---------------- */}
            <div>
              <h3 className="text-sm font-bold mb-1 text-base-muted uppercase tracking-wide">
                Fan Community CTA (optional)
              </h3>
              <p className="text-xs text-base-muted mb-3">
                One branded button pointing fans to your community — Instagram, a WhatsApp
                Channel, Discord, wherever they belong. Give it your own fandom name, like
                &quot;Join the Nation.&quot;
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-base-bg border border-base-border flex items-center justify-center shrink-0">
                    <CommunityIcon size={22} className="text-base-muted" />
                  </div>
                  <div className="min-w-0 flex-1 bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 transition focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                    <label htmlFor="community_url" className="block text-[11px] font-semibold text-base-muted mb-0.5">
                      Community Link
                    </label>
                    <input
                      id="community_url"
                      type="url"
                      name="community_url"
                      value={form.community_url}
                      onChange={handleFieldChange}
                      placeholder="https://instagram.com/youraccount"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-base-muted/60"
                    />
                  </div>
                </div>
                <div className="min-w-0 bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 transition focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                  <label htmlFor="community_label" className="block text-[11px] font-semibold text-base-muted mb-0.5">
                    Button Text (optional)
                  </label>
                  <input
                    id="community_label"
                    type="text"
                    name="community_label"
                    value={form.community_label}
                    onChange={handleFieldChange}
                    maxLength={40}
                    placeholder="Join the Nation"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-base-muted/60"
                  />
                </div>
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
                  <p className="text-sm font-semibold mb-2">Unlock with a paid plan</p>
                  <a
                    href={UPGRADE_ANCHOR}
                    className="bg-brand hover:bg-brand-dark transition text-base-bg text-xs font-bold rounded-lg px-4 py-2"
                  >
                    See Plans
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
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold">Your SmartLinks</h2>
              {!isPro && (
                <span className="text-xs text-base-muted shrink-0">
                  {links.length}/{FREE_TIER_LINK_LIMIT} used
                </span>
              )}
            </div>
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {links.length === 0 && (
                <p className="text-sm text-base-muted">
                  You haven&apos;t created any SmartLinks yet.
                </p>
              )}
              {links.map((link) => (
                <div
                  key={link.id}
                  className="relative bg-base-bg border border-base-border rounded-lg p-3.5 hover:border-brand transition"
                >
                  <button
                    type="button"
                    onClick={() => handleDeleteLink(link)}
                    disabled={deletingId === link.id}
                    aria-label="Delete SmartLink"
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-base-muted hover:text-white hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {deletingId === link.id ? "…" : "✕"}
                  </button>
                  <a
                    href={`/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block pr-6"
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
                          {APP_URL || "droppa.fm"}/{link.slug}
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Custom Domain ---------------- */}
        {isPro && (
          <section className="glass-card rounded-xl2 p-5 sm:p-6">
            <h2 className="text-lg font-bold mb-4">Custom Domain</h2>
            <form
              onSubmit={handleSaveDomain}
              className="flex flex-col sm:flex-row gap-3 items-start sm:items-end"
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
            {domainError && <p className="text-sm text-red-400 mt-2">{domainError}</p>}
            {user?.custom_domain ? (
              <div className="mt-4 pt-4 border-t border-base-border text-xs text-base-muted space-y-1.5">
                <p className="font-semibold text-white">Two one-time steps to finish setup:</p>
                <p>
                  1. At your domain registrar, point <span className="text-white">{user.custom_domain}</span>{" "}
                  at this app — add a CNAME record with value{" "}
                  <code className="text-brand-light">cname.vercel-dns.com</code> (or, for a root/apex domain,
                  an A record to <code className="text-brand-light">76.76.21.21</code>).
                </p>
                <p>
                  2. Add <span className="text-white">{user.custom_domain}</span> under Settings → Domains in
                  the Vercel project this site is deployed on. Vercel will confirm once DNS is detected — that
                  step can&rsquo;t be done from here, since only the site&rsquo;s owner has access to that
                  project.
                </p>
                <p>
                  Once both are done, visiting {user.custom_domain} will automatically land on your most
                  recent SmartLink.
                </p>
              </div>
            ) : null}
          </section>
        )}

        {/* ---------------- Account Settings ---------------- */}
        <section className="glass-card rounded-xl2 p-5 sm:p-6">
          <h2 className="text-lg font-bold mb-4">Account Settings</h2>

          {user && !user.email_verified && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-amber-950/30 border border-amber-900/60 rounded-lg px-4 py-3">
              <p className="text-sm text-amber-200">
                Your email isn&rsquo;t verified yet. Check your inbox for a confirmation link.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="text-xs font-semibold text-amber-200 hover:text-white border border-amber-900/60 hover:border-amber-200 rounded-lg px-3 py-1.5 transition disabled:opacity-60"
                >
                  {resendLoading ? "Sending…" : "Resend email"}
                </button>
              </div>
              {resendMessage && <p className="w-full text-xs text-amber-200/80">{resendMessage}</p>}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <h3 className="text-sm font-semibold text-base-muted uppercase tracking-wide">Change Password</h3>
            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5" htmlFor="current-password">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5" htmlFor="new-password">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5" htmlFor="confirm-new-password">
                Confirm new password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
              />
            </div>

            {passwordError && (
              <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="text-sm text-brand-light bg-brand/10 border border-brand/30 rounded-lg px-3 py-2">
                {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full sm:w-auto bg-base-card border border-base-border hover:border-brand transition text-white font-semibold rounded-lg px-5 py-2.5 text-sm disabled:opacity-60"
            >
              {passwordSaving ? "Saving…" : "Update password"}
            </button>
          </form>
        </section>

        <footer className="pt-4 pb-2">
          <SiteFooter />
        </footer>
      </main>
    </div>
  );
}
