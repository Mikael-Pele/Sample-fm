import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
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
  TikTokIcon,
  BookingIcon,
  CommunityIcon,
  UploadIcon,
  LockIcon,
} from "./PlatformIcons";
import SiteFooter from "./SiteFooter";
import ThemeToggle from "./ThemeToggle";
import ClicksChart from "./ClicksChart";
import DashboardOverview, { StatTile } from "./DashboardOverview";
import {
  DashboardSidebar,
  MenuIcon,
  PAGE_TITLES,
} from "./DashboardLayout";
import InstallAppPrompt from "./InstallAppPrompt";
import ReleasesPage from "./ReleasesPage";
import PayoutsPage from "./PayoutsPage";
import EpkEditor from "./EpkEditor";
import BusinessUpgradeModal from "./BusinessUpgradeModal";
import RangePicker, { rangeDescription } from "./RangePicker";
import { ReportProblemTrigger } from "./ReportProblemModal";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_E164, SUPPORT_WHATSAPP_URL } from "../lib/support";
import { COMING_SOON_FEATURES, PLAN, PLAN_PRICE_GHS, TRIAL_LINK_LIMIT } from "../lib/plans";

// Shown only to paying subscribers as a direct line for support — a perk
// of paying, not something free-tier users see.
const PREMIUM_SUPPORT_PHONE_DISPLAY = SUPPORT_PHONE_DISPLAY;
const PREMIUM_SUPPORT_WHATSAPP_URL = SUPPORT_WHATSAPP_URL;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

// A single "upgrade now" link for the small in-context gates scattered
// through the form (pixels, locked analytics, etc.) — they send people to
// the plan picker in the billing panel rather than guessing.
const UPGRADE_HREF = "/dashboard?page=settings#billing";

const ACCESS_LABEL = {
  active: "Artist plan",
  trial: "Free trial",
  expired: "Trial ended",
};

function formatLongDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

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
  url_tiktok: "",
  community_url: "",
  community_label: "",
  booking_url: "",
  booking_label: "",
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
  { key: "url_tiktok", label: "TikTok", Icon: TikTokIcon, ring: "focus-within:ring-white" },
];

// Display metadata for the per-platform click breakdown (trial or paid). Keyed
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
  tiktok: { label: "TikTok", Icon: TikTokIcon, barClass: "bg-fg" },
  booking: { label: "Business & Bookings", Icon: BookingIcon, barClass: "bg-base-muted" },
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
          className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-base-muted/60"
        />
      </div>
    </div>
  );
}

const ANALYTICS_RANGES = [7, 30, 90, 120, 365];

// "↑ 18% vs prior 30d" — compares the selected range against the
// same number of days just before it.
function clicksDelta(analytics) {
  if (!analytics) return { text: "", className: undefined };
  const { total_clicks: now, previous_clicks: before, range_days: days } = analytics;
  if (!before) {
    return {
      text: now > 0 ? `New in the last ${days} days` : "",
      className: "text-emerald-400",
    };
  }
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return { text: `Same as prior ${days}d`, className: undefined };
  return {
    text: `${pct > 0 ? "↑" : "↓"} ${Math.abs(pct)}% vs prior ${days}d`,
    className: pct > 0 ? "text-emerald-400" : "text-red-400",
  };
}

function platformLabel(key) {
  return (PLATFORM_META[key] && PLATFORM_META[key].label) || key;
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
  const [releases, setReleases] = useState([]);
  const [payouts, setPayouts] = useState([]);
  // Just enough of the EPK for the overview strip; the editor loads the rest.
  const [epkSummary, setEpkSummary] = useState(null);
  const [lockedFeature, setLockedFeature] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  // A number of days, or "custom" to use customRange ({ from, to }).
  const [analyticsRange, setAnalyticsRange] = useState(30);
  const [customRange, setCustomRange] = useState(null);
  const [rangeError, setRangeError] = useState("");
  // "" = every SmartLink combined; otherwise one SmartLink's id.
  const [analyticsLinkId, setAnalyticsLinkId] = useState("");
  const analyticsRef = useRef(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [droppedFieldsNotice, setDroppedFieldsNotice] = useState([]);
  // null = the form is creating a new SmartLink. Any other value = the id
  // of the existing SmartLink being edited in place — same form, PUT
  // instead of POST.
  const [editingId, setEditingId] = useState(null);
  const formTopRef = useRef(null);
  const [deletingId, setDeletingId] = useState(null);
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

  // Paid = on the yearly plan. hasAccess = paid or still inside the free
  // trial; expired accounts keep their live links but can't create or edit.
  const accessStatus = user?.access_status || "expired";
  const isPro = accessStatus === "active";
  const hasAccess = accessStatus !== "expired";
  const trialDaysLeft =
    accessStatus === "trial" && user?.trial_ends_at
      ? Math.max(1, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / 86400000))
      : 0;

  // Which dashboard page is showing lives in ?page= so it survives reloads
  // and the back button. Unknown values fall back to the overview.
  const page = PAGE_TITLES[router.query.page] ? router.query.page : "overview";
  const [navOpen, setNavOpen] = useState(false);
  const mainRef = useRef(null);
  const billingRef = useRef(null);
  const pendingScrollRef = useRef(null);

  function goToPage(next, scrollTarget) {
    setNavOpen(false);
    pendingScrollRef.current = scrollTarget || null;
    if (next === page) {
      scrollToPending();
      return;
    }
    // The overview always shows every SmartLink, not one filtered on Analytics.
    if (next === "overview") setAnalyticsLinkId("");
    router.push(
      { pathname: "/dashboard", query: next === "overview" ? {} : { page: next } },
      undefined,
      { shallow: true }
    );
  }

  function scrollToPending() {
    const target = pendingScrollRef.current;
    pendingScrollRef.current = null;
    if (target && target.current) {
      target.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (window.location.hash === "#billing" && billingRef.current) {
      // Arriving from Paystack's callback page or an upgrade link.
      billingRef.current.scrollIntoView({ block: "start" });
    } else if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0 });
    }
  }

  useEffect(() => {
    scrollToPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function goToBilling(e) {
    if (e) e.preventDefault();
    goToPage("settings", billingRef);
  }

  const artistName = links[0]?.artist_name || (user?.email || "").split("@")[0] || "Artist";

  const loadLinks = useCallback(async () => {
    const res = await fetch("/api/links/list");
    if (res.ok) {
      const data = await res.json();
      setLinks(data.smartlinks || []);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    // "Custom" with no dates applied yet keeps showing the last result.
    if (analyticsRange === "custom" && !customRange) return;
    const params = new URLSearchParams(
      analyticsRange === "custom" ? customRange : { days: String(analyticsRange) }
    );
    if (analyticsLinkId) params.set("link_id", analyticsLinkId);
    const res = await fetch(`/api/analytics/summary?${params}`);
    if (res.ok) {
      const data = await res.json();
      setAnalytics(data);
      setRangeError("");
    } else if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      setRangeError(data.error || "That date range didn't work.");
    } else if (res.status === 404 && analyticsLinkId) {
      // The filtered SmartLink was deleted — fall back to all links.
      setAnalyticsLinkId("");
    }
  }, [analyticsRange, customRange, analyticsLinkId]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    fetch("/api/releases")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setReleases(data.releases || []))
      .catch(() => {});
    fetch("/api/payouts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setPayouts(data.payouts || []))
      .catch(() => {});
    fetch("/api/epk")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setEpkSummary({ handle: data.epk.handle, published: data.saved && data.epk.published }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  function showLinkStats(linkId) {
    setAnalyticsLinkId(linkId);
    goToPage("analytics", analyticsRef);
  }

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

    const isEditing = Boolean(editingId);

    try {
      const res = await fetch(isEditing ? `/api/links/${editingId}` : "/api/links/create", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          artwork_url: cleanGallery[0] || "",
          artwork_urls: cleanGallery,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || `Could not ${isEditing ? "save" : "create"} SmartLink.`);
        setCreating(false);
        return;
      }

      setCreateSuccess(
        isEditing
          ? `Saved: ${APP_URL || "droppa.fm"}/${data.smartlink.slug}`
          : `SmartLink created: ${APP_URL}/${data.smartlink.slug}`
      );
      if (data.dropped_fields && data.dropped_fields.length > 0) {
        setDroppedFieldsNotice(data.dropped_fields);
      }
      setForm(EMPTY_FORM);
      setArtworkItems([]);
      setEditingId(null);
      loadLinks();
      loadAnalytics();
    } catch (err) {
      setCreateError(`Network error while ${isEditing ? "saving" : "creating"} SmartLink.`);
    } finally {
      setCreating(false);
    }
  }

  // Populates the (shared) create/edit form with an existing SmartLink's
  // data and switches it into edit mode. Reconstructs artworkItems from
  // the already-hosted gallery URLs so re-submitting doesn't require
  // re-uploading anything untouched.
  function handleEditClick(link) {
    setCreateError("");
    setCreateSuccess("");
    setDroppedFieldsNotice([]);
    setEditingId(link.id);
    setForm({
      artist_name: link.artist_name || "",
      track_title: link.track_title || "",
      custom_slug: link.slug || "",
      release_date: link.release_date ? link.release_date.slice(0, 10) : "",
      is_presave: Boolean(link.is_presave),
      url_audiomack: link.url_audiomack || "",
      url_boomplay: link.url_boomplay || "",
      url_spotify: link.url_spotify || "",
      url_apple: link.url_apple || "",
      url_youtube: link.url_youtube || "",
      url_deezer: link.url_deezer || "",
      url_tidal: link.url_tidal || "",
      url_soundcloud: link.url_soundcloud || "",
      url_pandora: link.url_pandora || "",
      url_iheartradio: link.url_iheartradio || "",
      url_whatsapp: link.url_whatsapp || "",
      url_tiktok: link.url_tiktok || "",
      community_url: link.community_url || "",
      community_label: link.community_label || "",
      // Stored as mailto: for emails; show the bare address when editing.
      booking_url: (link.booking_url || "").replace(/^mailto:/i, ""),
      booking_label: link.booking_label || "",
      pixel_fb: link.pixel_fb || "",
      pixel_tiktok: link.pixel_tiktok || "",
    });

    const galleryUrls = link.artwork_urls
      ? link.artwork_urls.split(",").filter(Boolean)
      : link.artwork_url
      ? [link.artwork_url]
      : [];
    setArtworkItems(
      galleryUrls.map((url) => ({
        id: nextArtworkItemId(),
        previewUrl: url,
        url,
        uploading: false,
        error: null,
        source: "url",
      }))
    );

    goToPage("smartlinks", formTopRef);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setArtworkItems([]);
    setCreateError("");
    setCreateSuccess("");
    setDroppedFieldsNotice([]);
  }

  async function handleUpgradeClick() {
    setUpgradeError("");
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/billing/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
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
      body: JSON.stringify({ is_pro: !isPro }),
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
    <div className="relative flex h-[100dvh] overflow-hidden bg-base-bg text-fg">
      <div className="light-streaks" aria-hidden="true" />
      <DashboardSidebar
        page={page}
        open={navOpen}
        onNavigate={goToPage}
        onClose={() => setNavOpen(false)}
        linkCount={links.length}
        artistName={artistName}
        planLabel={ACCESS_LABEL[accessStatus]}
        isPro={isPro}
        onLogout={handleLogout}
        onLockedFeature={(key) => {
          setNavOpen(false);
          setLockedFeature(key);
        }}
      />

      <div ref={mainRef} className="relative z-10 flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
      <header className="sticky top-0 z-20 bg-base-bg/95 backdrop-blur border-b border-base-border">
        <div className="px-4 sm:px-7 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              className="md:hidden w-9 h-9 -ml-1.5 flex items-center justify-center rounded-lg text-base-muted hover:text-fg transition shrink-0"
            >
              <MenuIcon />
            </button>
            <h1 className="text-lg font-bold truncate">{PAGE_TITLES[page]}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            {hasAccess && analytics && analytics.presaves.length > 0 && (page === "overview" || page === "analytics") && (
              <button
                type="button"
                onClick={exportEmailsCsv}
                className="hidden sm:inline-flex items-center gap-1.5 bg-base-card border border-base-border hover:border-base-muted transition text-fg font-semibold rounded-lg px-3.5 py-2 text-sm"
              >
                ⬇ Export
              </button>
            )}
            <button
              type="button"
              onClick={() => goToPage("smartlinks", formTopRef)}
              className="bg-brand hover:bg-brand-dark transition text-white font-semibold rounded-lg px-3 sm:px-4 py-2 text-sm whitespace-nowrap"
            >
              + <span className="hidden sm:inline">New </span>SmartLink
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-7 py-6 space-y-6">
        {page === "overview" && (
          <>
        <InstallAppPrompt />
            <DashboardOverview
              analytics={analytics}
              links={links}
              linksHint={
                isPro ? "Unlimited on your plan" : hasAccess ? `${links.length}/${TRIAL_LINK_LIMIT} during trial` : "Subscribe to add more"
              }
              ranges={ANALYTICS_RANGES}
              range={analyticsRange}
              onRangeChange={setAnalyticsRange}
              delta={clicksDelta(analytics)}
              platformMeta={PLATFORM_META}
              platformFields={PLATFORM_FIELDS}
              artistName={artistName}
              onNavigate={goToPage}
              onShowLinkStats={showLinkStats}
              onUpgrade={goToBilling}
              releases={releases}
              epk={epkSummary}
            />
          </>
        )}

        {page === "releases" && (
          <ReleasesPage releases={releases} onChange={setReleases} canEdit={hasAccess} onUpgrade={goToBilling} links={links} />
        )}
        {page === "epk" && (
          <EpkEditor
            canEdit={hasAccess}
            onUpgrade={goToBilling}
            onSaved={(epk) => setEpkSummary({ handle: epk.handle, published: epk.published })}
          />
        )}
        {page === "payouts" && (
          <PayoutsPage payouts={payouts} onChange={setPayouts} canEdit={hasAccess} onUpgrade={goToBilling} />
        )}

        {page === "settings" && (
        <>
        {/* ---------------- Billing Component ---------------- */}
        <section id="billing" ref={billingRef} className="glass-card rounded-xl2 p-5 sm:p-6 scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-base-muted uppercase tracking-wide mb-1">
                Your Plan
              </div>
              <div className="text-xl sm:text-2xl font-extrabold mb-1">
                {isPro ? PLAN.name : ACCESS_LABEL[accessStatus]}
              </div>
              <p className="text-sm text-base-muted max-w-md">
                {isPro
                  ? `Unlimited SmartLinks, full analytics, fan email exports, and no Droppa.fm badge on your links.${
                      user?.plan_expires_at ? ` Renews ${formatLongDate(user.plan_expires_at)}.` : ""
                    }`
                  : hasAccess
                  ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left of your free trial (ends ${formatLongDate(
                      user.trial_ends_at
                    )}). You can create ${TRIAL_LINK_LIMIT} SmartLink and use every other feature until then. Subscribe for unlimited SmartLinks.`
                  : "Your free trial has ended. Your SmartLinks stay live, but you need a subscription to create or edit links and to see your full analytics and fan emails."}
              </p>
            </div>
            {!IS_PRODUCTION && (
              <button
                type="button"
                onClick={handleSimulateUpgrade}
                className="shrink-0 text-xs text-base-muted hover:text-brand-light border border-dashed border-base-border hover:border-brand-light rounded-lg px-4 py-2 transition"
              >
                {isPro ? "[Cancel paid plan — dev testing]" : "[Simulate payment — dev testing]"}
              </button>
            )}
          </div>

          {!isPro && (
            <div className="max-w-sm bg-base-bg border-2 border-brand rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-bold text-sm">{PLAN.name}</div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-brand">Founding artist price</span>
              </div>
              <div className="text-2xl font-extrabold mb-0.5">
                ${PLAN.priceUsd}
                <span className="text-sm font-medium text-base-muted">/year</span>
              </div>
              <div className="text-xs text-base-muted mb-3">
                Charged as GH&#8373;{PLAN_PRICE_GHS} a year. Locked in for as long as you stay subscribed.
              </div>
              <p className="text-xs text-base-muted mb-4 flex-1">
                Unlimited SmartLinks, full analytics, fan email exports, no Droppa.fm badge.
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
                {upgradeLoading ? "Redirecting to checkout…" : "Subscribe for $" + PLAN.priceUsd + "/year"}
              </button>
            </div>
          )}

          <div className="mt-5 text-xs text-base-muted">
            <span className="font-semibold text-fg">Coming soon:</span>{" "}
            {COMING_SOON_FEATURES.join(", ")}.
          </div>

          {isPro && (
            <div className="mt-6 pt-6 border-t border-base-border flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <span className="font-semibold text-fg">Priority support</span>
              <a
                href={`tel:${SUPPORT_PHONE_E164}`}
                className="text-base-muted hover:text-fg transition"
              >
                Call {PREMIUM_SUPPORT_PHONE_DISPLAY}
              </a>
              <a
                href={PREMIUM_SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base-muted hover:text-fg transition"
              >
                WhatsApp
              </a>
              <ReportProblemTrigger className="text-base-muted hover:text-fg transition" />
            </div>
          )}
        </section>

        </>
        )}

        {/* ---------------- Analytics Panel ---------------- */}
        {page === "analytics" && (
        <section ref={analyticsRef} className="scroll-mt-20">
          <div className="flex items-start justify-end gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 min-w-0 w-full sm:w-auto">
              <label htmlFor="analytics-link" className="sr-only">
                SmartLink
              </label>
              <select
                id="analytics-link"
                value={analyticsLinkId}
                onChange={(e) => setAnalyticsLinkId(e.target.value)}
                className="min-w-0 flex-1 sm:flex-none sm:max-w-[240px] bg-base-bg border border-base-border rounded-lg px-3 py-2 text-xs text-fg outline-none focus:border-brand transition"
              >
                <option value="">All SmartLinks</option>
                {links.map((link) => (
                  <option key={link.id} value={link.id}>
                    {link.track_title} — {link.artist_name}
                  </option>
                ))}
              </select>
              <RangePicker
                ranges={ANALYTICS_RANGES}
                range={analyticsRange}
                onRangeChange={setAnalyticsRange}
                customRange={customRange}
                onCustomRangeChange={setCustomRange}
                error={rangeError}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <StatTile
              label={`Clicks (${analytics ? analytics.range_days : analyticsRange}d)`}
              value={analytics ? analytics.total_clicks.toLocaleString() : "—"}
              hint={clicksDelta(analytics).text}
              hintClass={clicksDelta(analytics).className}
            />
            <StatTile
              label="Top Platform"
              value={analytics && analytics.top_platform ? platformLabel(analytics.top_platform) : "—"}
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

          {/* ---------------- Clicks over time + top SmartLinks ---------------- */}
          <div className={`grid gap-4 mb-6 ${analyticsLinkId ? "" : "lg:grid-cols-3"}`}>
            <div className="glass-card rounded-xl2 overflow-hidden min-w-0 lg:col-span-2">
              <div className="px-4 sm:px-5 py-4 border-b border-base-border font-semibold text-sm">
                Clicks {rangeDescription(analytics, analyticsRange)}
              </div>
              <div className="px-3 sm:px-4 pt-4 pb-2">
                {analytics ? (
                  <ClicksChart daily={analytics.daily} />
                ) : (
                  <div className="h-[180px]" />
                )}
                {analytics && analytics.total_clicks === 0 && (
                  <p className="text-xs text-base-muted text-center pb-2">
                    No clicks in this period yet. Share your SmartLink to start seeing fans here.
                  </p>
                )}
              </div>
            </div>

            {!analyticsLinkId && (
              <div className="glass-card rounded-xl2 overflow-hidden min-w-0">
                <div className="px-4 sm:px-5 py-4 border-b border-base-border font-semibold text-sm">
                  Top SmartLinks
                </div>
                <div className="px-4 sm:px-5 py-2">
                  {analytics && analytics.link_breakdown.length > 0 ? (
                    analytics.link_breakdown.slice(0, 5).map((row) => {
                      const max = analytics.link_breakdown[0].count || 1;
                      return (
                        <button
                          key={row.link_id}
                          type="button"
                          onClick={() => showLinkStats(row.link_id)}
                          className="w-full flex items-center gap-3 py-2.5 border-b border-base-border/60 last:border-b-0 text-left group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate group-hover:text-brand-light transition">
                              {row.track_title}
                            </div>
                            <div className="text-xs text-base-muted truncate">/{row.slug}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold tabular-nums">
                              {row.count.toLocaleString()}
                            </div>
                            <div className="w-14 h-1 rounded-full bg-base-bg overflow-hidden mt-1">
                              <div
                                className="h-full bg-brand"
                                style={{ width: `${Math.max(6, Math.round((row.count / max) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-base-muted text-center py-6">No clicks yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl2 overflow-hidden relative">
            <div className="px-4 sm:px-5 py-4 border-b border-base-border font-semibold text-sm flex items-center justify-between gap-3">
              <span>Fan Emails Collected via Pre-Saves</span>
              {hasAccess && analytics && analytics.presaves.length > 0 && (
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
                  <p className="text-sm font-semibold text-fg mb-1">
                    {analytics.presave_count} pre-save{analytics.presave_count === 1 ? "" : "s"}{" "}
                    collected
                  </p>
                  <p className="text-sm text-base-muted mb-4 max-w-xs">
                    Subscribe to unlock, view, and export your fan email database.
                  </p>
                  <a
                    href={UPGRADE_HREF}
                    onClick={goToBilling}
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

          {/* ---------------- Full Platform & Country Breakdown (trial or paid) ---------------- */}
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
                      <a href={UPGRADE_HREF}
                    onClick={goToBilling} className="text-brand-light hover:text-brand">
                        Subscribe
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
                      const share = Math.round((row.count / (analytics.total_clicks || 1)) * 100);
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
                          <span className="text-xs font-semibold text-fg w-8 text-right shrink-0 tabular-nums">
                            {row.count}
                          </span>
                          <span className="text-xs text-base-muted w-9 text-right shrink-0 tabular-nums">
                            {share}%
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
                      <a href={UPGRADE_HREF}
                    onClick={goToBilling} className="text-brand-light hover:text-brand">
                        Subscribe
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
                          <span className="text-xs font-semibold text-fg w-8 text-right shrink-0">
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
        )}

        {/* ---------------- Create/Edit SmartLink Form ---------------- */}
        {page === "smartlinks" && (
        <section className="grid lg:grid-cols-5 gap-6 lg:gap-8 scroll-mt-20" ref={formTopRef}>
          <form
            onSubmit={handleCreateLink}
            className="lg:col-span-3 glass-card rounded-xl2 p-5 sm:p-6 space-y-6 min-w-0"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                {editingId ? "Edit SmartLink" : "Create a New SmartLink"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-base-muted hover:text-fg transition shrink-0"
                >
                  Cancel edit
                </button>
              )}
            </div>

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
                Custom Link (optional — like droppa.fm/catch-the-feeling)
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
                  className="flex-1 min-w-0 bg-transparent text-sm text-fg outline-none placeholder:text-base-muted/60"
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
                <p className="text-sm font-semibold text-fg">
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
                    className="bg-base-card border border-base-border hover:border-brand transition text-fg font-semibold rounded-lg px-4 py-2.5 text-sm shrink-0"
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
                      className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-base-muted/60"
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
                    className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-base-muted/60"
                  />
                </div>
              </div>
            </div>

            {/* ---------------- Business & Bookings ---------------- */}
            <div>
              <h3 className="text-sm font-bold mb-1 text-base-muted uppercase tracking-wide">
                Business &amp; Bookings (optional)
              </h3>
              <p className="text-xs text-base-muted mb-3">
                A button for promoters, brands and press to reach you — your bookings email or a
                booking form link.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-base-bg border border-base-border flex items-center justify-center shrink-0">
                    <BookingIcon size={22} className="text-base-muted" />
                  </div>
                  <div className="min-w-0 flex-1 bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 transition focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                    <label htmlFor="booking_url" className="block text-[11px] font-semibold text-base-muted mb-0.5">
                      Bookings Email or Link
                    </label>
                    <input
                      id="booking_url"
                      type="text"
                      name="booking_url"
                      value={form.booking_url}
                      onChange={handleFieldChange}
                      placeholder="bookings@yourname.com"
                      className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-base-muted/60"
                    />
                  </div>
                </div>
                <div className="min-w-0 bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 transition focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                  <label htmlFor="booking_label" className="block text-[11px] font-semibold text-base-muted mb-0.5">
                    Button Text (optional)
                  </label>
                  <input
                    id="booking_label"
                    type="text"
                    name="booking_label"
                    value={form.booking_label}
                    onChange={handleFieldChange}
                    maxLength={40}
                    placeholder="Business & Bookings"
                    className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-base-muted/60"
                  />
                </div>
              </div>
            </div>

            {/* ---------------- Retargeting pixels (coming soon) ---------------- */}
            <div className="flex items-start gap-3 bg-base-bg border border-dashed border-base-border rounded-lg px-4 py-3">
              <LockIcon className="text-base-muted mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  Facebook &amp; TikTok Pixels{" "}
                  <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-brand">Coming soon</span>
                </div>
                <p className="text-xs text-base-muted mt-0.5">
                  Retarget fans who tap your SmartLinks with ads on Facebook, Instagram and TikTok.
                </p>
              </div>
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
                {droppedFieldsNotice.join(", ")} were not saved. Pixels are coming soon.
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 transition text-base-bg font-bold rounded-lg py-3 text-sm"
            >
              {creating
                ? editingId
                  ? "Saving…"
                  : "Creating…"
                : editingId
                ? "Save Changes"
                : "Create SmartLink"}
            </button>
          </form>

          {/* ---------------- SmartLinks List ---------------- */}
          <div className="lg:col-span-2 glass-card rounded-xl2 p-5 sm:p-6 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold">Your SmartLinks</h2>
              {!hasAccess && (
                <a
                  href={UPGRADE_HREF}
                  onClick={goToBilling}
                  className="text-xs font-semibold text-brand-light hover:text-brand shrink-0"
                >
                  Subscribe to add or edit links
                </a>
              )}
              {accessStatus === "trial" && (
                <a
                  href={UPGRADE_HREF}
                  onClick={goToBilling}
                  className="text-xs text-base-muted hover:text-fg shrink-0"
                >
                  {links.length}/{TRIAL_LINK_LIMIT} on trial · Subscribe for unlimited
                </a>
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
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditClick(link)}
                      aria-label="Edit SmartLink"
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-base-muted hover:text-white hover:bg-brand hover:text-base-bg transition text-xs"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(link)}
                      disabled={deletingId === link.id}
                      aria-label="Delete SmartLink"
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-base-muted hover:text-white hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {deletingId === link.id ? "…" : "✕"}
                    </button>
                  </div>
                  <a
                    href={`/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block pr-14"
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
                  </a>
                  <div className="flex items-center gap-3 mt-2 text-xs text-base-muted flex-wrap">
                    <span>{link._count?.analytics ?? 0} clicks</span>
                    <span>{link._count?.presaves ?? 0} pre-saves</span>
                    {link.is_presave && (
                      <span className="text-amber-400 font-semibold">PRE-SAVE</span>
                    )}
                    <button
                      type="button"
                      onClick={() => showLinkStats(link.id)}
                      className="ml-auto font-semibold text-brand-light hover:text-brand transition"
                    >
                      View stats ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {page === "settings" && (
        <>
        {/* ---------------- Custom Domain ---------------- */}
        <section className="glass-card rounded-xl2 p-5 sm:p-6">
          <h2 className="text-lg font-bold mb-1">
            Custom Domain{" "}
            <span className="ml-1 align-middle text-[10px] font-bold uppercase tracking-wide text-brand">
              Coming soon
            </span>
          </h2>
          <p className="text-sm text-base-muted">
            Put your SmartLinks on your own domain, like links.yourname.com, instead of droppa.fm.
          </p>
        </section>

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
                  className="text-xs font-semibold text-amber-200 hover:text-fg border border-amber-900/60 hover:border-amber-200 rounded-lg px-3 py-1.5 transition disabled:opacity-60"
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
              className="w-full sm:w-auto bg-base-card border border-base-border hover:border-brand transition text-fg font-semibold rounded-lg px-5 py-2.5 text-sm disabled:opacity-60"
            >
              {passwordSaving ? "Saving…" : "Update password"}
            </button>
          </form>
        </section>
        </>
        )}

        <footer className="pt-4 pb-2">
          <SiteFooter />
        </footer>
      </main>
      </div>
      <BusinessUpgradeModal featureKey={lockedFeature} onClose={() => setLockedFeature(null)} />
    </div>
  );
}
