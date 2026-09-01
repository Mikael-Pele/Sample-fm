import { useState, useMemo, useCallback } from "react";
import Head from "next/head";
import {
  AudiomackIcon,
  BoomplayIcon,
  SpotifyIcon,
  AppleMusicIcon,
  YouTubeMusicIcon,
  SampleFmMark,
} from "./PlatformIcons";

function formatReleaseDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function SmartLinkPage({ smartlink, isAfricanFan, fanCountry, ownerIsPro }) {
  const [presaveModalOpen, setPresaveModalOpen] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isPresaveMode =
    smartlink.is_presave || new Date(smartlink.release_date).getTime() > Date.now();

  const platforms = useMemo(() => {
    const all = [
      {
        key: "audiomack",
        label: "Audiomack",
        url: smartlink.url_audiomack,
        Icon: AudiomackIcon,
        accentBg: "bg-audiomack/10",
        accentText: "text-audiomack",
        accentBorder: "hover:border-audiomack",
        buttonBg: "bg-audiomack",
      },
      {
        key: "boomplay",
        label: "Boomplay",
        url: smartlink.url_boomplay,
        Icon: BoomplayIcon,
        accentBg: "bg-boomplay/10",
        accentText: "text-boomplay",
        accentBorder: "hover:border-boomplay",
        buttonBg: "bg-boomplay",
      },
      {
        key: "spotify",
        label: "Spotify",
        url: smartlink.url_spotify,
        Icon: SpotifyIcon,
        accentBg: "bg-spotify/10",
        accentText: "text-spotify",
        accentBorder: "hover:border-spotify",
        buttonBg: "bg-spotify",
      },
      {
        key: "apple",
        label: "Apple Music",
        url: smartlink.url_apple,
        Icon: AppleMusicIcon,
        accentBg: "bg-apple/10",
        accentText: "text-apple",
        accentBorder: "hover:border-apple",
        buttonBg: "bg-apple",
      },
      {
        key: "youtube",
        label: "YouTube Music",
        url: smartlink.url_youtube,
        Icon: YouTubeMusicIcon,
        accentBg: "bg-youtube/10",
        accentText: "text-youtube",
        accentBorder: "hover:border-youtube",
        buttonBg: "bg-youtube",
      },
    ].filter((p) => Boolean(p.url));

    if (!isAfricanFan) return all;

    // Geo-Targeting: bubble Audiomack and Boomplay to the top of the stack
    // for fans detected inside African markets.
    const africanFirst = ["audiomack", "boomplay"];
    return [...all].sort((a, b) => {
      const aIsAfricanPlatform = africanFirst.includes(a.key);
      const bIsAfricanPlatform = africanFirst.includes(b.key);
      if (aIsAfricanPlatform && !bIsAfricanPlatform) return -1;
      if (!aIsAfricanPlatform && bIsAfricanPlatform) return 1;
      return 0;
    });
  }, [smartlink, isAfricanFan]);

  const trackClick = useCallback(
    async (platformKey) => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: smartlink.slug,
            platform_clicked: platformKey,
            simulated_country: fanCountry,
          }),
        });
      } catch (err) {
        // Analytics failures should never block the fan from reaching music.
        console.error("track click failed", err);
      }
    },
    [smartlink.slug, fanCountry]
  );

  async function handlePlatformClick(platform) {
    if (isPresaveMode) {
      setPendingPlatform(platform);
      setPresaveModalOpen(true);
      setSubmitError("");
      setSubmitted(false);
      return;
    }

    await trackClick(platform.key);
    window.open(platform.url, "_blank", "noopener,noreferrer");
  }

  async function handlePresaveSubmit(e) {
    e.preventDefault();
    if (!pendingPlatform) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/presave/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: smartlink.slug,
          fan_email: email,
          provider: pendingPlatform.key,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Could not register your pre-save.");
        setSubmitting(false);
        return;
      }

      await trackClick(pendingPlatform.key);
      setSubmitted(true);
      setSubmitting(false);
    } catch (err) {
      setSubmitError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  function closeModal() {
    setPresaveModalOpen(false);
    setPendingPlatform(null);
    setEmail("");
    setSubmitError("");
    setSubmitted(false);
  }

  const pageTitle = `${smartlink.track_title} — ${smartlink.artist_name} | Sample.fm`;

  return (
    <div className="min-h-screen bg-base-bg flex items-center justify-center px-4 py-10">
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={`Stream or pre-save "${smartlink.track_title}" by ${smartlink.artist_name} on Audiomack, Boomplay, Spotify, Apple Music, and YouTube Music.`}
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:image" content={smartlink.artwork_url} />
      </Head>

      <div className="w-full max-w-sm glass-card rounded-xl2 shadow-glass p-6 relative">
        <div className="w-full aspect-square rounded-xl overflow-hidden mb-5 bg-base-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={smartlink.artwork_url}
            alt={`${smartlink.track_title} artwork`}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-extrabold text-white leading-tight">
            {smartlink.track_title}
          </h1>
          <p className="text-base-muted text-sm font-medium mt-1">{smartlink.artist_name}</p>
          {isPresaveMode && (
            <p className="text-xs text-brand-light font-semibold mt-2 uppercase tracking-wide">
              Releasing {formatReleaseDate(smartlink.release_date)}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          {platforms.map((platform) => (
            <button
              key={platform.key}
              type="button"
              onClick={() => handlePlatformClick(platform)}
              className={`w-full flex items-center gap-3 bg-base-bg border border-base-border rounded-xl px-4 py-3 transition ${platform.accentBorder}`}
            >
              <platform.Icon />
              <span className="flex-1 text-left text-sm font-semibold text-white">
                {platform.label}
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg text-base-bg ${platform.buttonBg}`}
              >
                {isPresaveMode ? "Pre-Save" : "Play"}
              </span>
            </button>
          ))}

          {platforms.length === 0 && (
            <p className="text-center text-sm text-base-muted py-6">
              No platform links have been added to this SmartLink yet.
            </p>
          )}
        </div>

        {!ownerIsPro && (
          <a
            href="/"
            className="mt-6 flex items-center justify-center gap-1.5 text-xs text-base-muted hover:text-white transition"
          >
            <SampleFmMark />
            Powered by <span className="font-semibold text-white">Sample.fm</span> — Create Your
            Own Free Artist SmartLink
          </a>
        )}
      </div>

      {presaveModalOpen && pendingPlatform && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm glass-card rounded-xl2 p-6 relative animate-fade-in">
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-4 right-4 text-base-muted hover:text-white transition"
            >
              ✕
            </button>

            {!submitted ? (
              <>
                <h2 className="text-lg font-bold text-white mb-1">
                  Pre-Save on {pendingPlatform.label}
                </h2>
                <p className="text-sm text-base-muted mb-5">
                  {smartlink.track_title} by {smartlink.artist_name} drops on{" "}
                  {formatReleaseDate(smartlink.release_date)}. Enter your email and we&apos;ll
                  automatically deliver it to your library on release day.
                </p>
                <form onSubmit={handlePresaveSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand transition"
                  />
                  {submitError && <p className="text-sm text-red-400">{submitError}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full text-base-bg font-bold rounded-lg py-2.5 text-sm transition disabled:opacity-60 ${pendingPlatform.buttonBg}`}
                  >
                    {submitting ? "Submitting…" : `Confirm Pre-Save`}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">✓</div>
                <h2 className="text-lg font-bold text-white mb-1">You&apos;re all set!</h2>
                <p className="text-sm text-base-muted mb-5">
                  We&apos;ll notify {pendingPlatform.label} to deliver{" "}
                  {smartlink.track_title} straight to your library the moment it drops.
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm text-brand-light font-semibold hover:text-white transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
