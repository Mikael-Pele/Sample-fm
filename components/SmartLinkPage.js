import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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

// Samples a small canvas copy of the current cover image and returns its
// average RGB color, used to subtly tint the page background so it shifts
// with the artwork — without ever loading an external color-extraction
// library (keeps the page under the 200KB budget).
function useAverageColor(imageUrl) {
  const [color, setColor] = useState(null);
  const cache = useRef({});

  useEffect(() => {
    if (!imageUrl) {
      setColor(null);
      return;
    }
    if (cache.current[imageUrl]) {
      setColor(cache.current[imageUrl]);
      return;
    }

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 10, 10);
        const { data } = ctx.getImageData(0, 0, 10, 10);
        let r = 0;
        let g = 0;
        let b = 0;
        const count = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        const rgb = `${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}`;
        cache.current[imageUrl] = rgb;
        if (!cancelled) setColor(rgb);
      } catch (err) {
        // Canvas can throw on cross-origin images without CORS headers —
        // fail silently and keep the default flat background.
        if (!cancelled) setColor(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) setColor(null);
    };
    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}

export default function SmartLinkPage({ smartlink, isAfricanFan, fanCountry, ownerIsPro }) {
  const [presaveModalOpen, setPresaveModalOpen] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const gallery =
    Array.isArray(smartlink.artwork_urls) && smartlink.artwork_urls.length > 0
      ? smartlink.artwork_urls
      : [smartlink.artwork_url];

  const currentImageUrl = gallery[activeImage] || gallery[0];
  const avgColor = useAverageColor(currentImageUrl);

  const isPresaveMode =
    smartlink.is_presave || new Date(smartlink.release_date).getTime() > Date.now();

  const platforms = useMemo(() => {
    const all = [
      {
        key: "audiomack",
        label: "Audiomack",
        url: smartlink.url_audiomack,
        Icon: AudiomackIcon,
        accentBorder: "hover:border-audiomack",
        buttonBg: "bg-audiomack",
        glow: "rgba(255, 130, 0, 0.45)",
      },
      {
        key: "boomplay",
        label: "Boomplay",
        url: smartlink.url_boomplay,
        Icon: BoomplayIcon,
        accentBorder: "hover:border-boomplay",
        buttonBg: "bg-boomplay",
        glow: "rgba(0, 229, 212, 0.45)",
      },
      {
        key: "spotify",
        label: "Spotify",
        url: smartlink.url_spotify,
        Icon: SpotifyIcon,
        accentBorder: "hover:border-spotify",
        buttonBg: "bg-spotify",
        glow: "rgba(29, 185, 84, 0.45)",
      },
      {
        key: "apple",
        label: "Apple Music",
        url: smartlink.url_apple,
        Icon: AppleMusicIcon,
        accentBorder: "hover:border-apple",
        buttonBg: "bg-apple",
        glow: "rgba(250, 36, 60, 0.45)",
      },
      {
        key: "youtube",
        label: "YouTube Music",
        url: smartlink.url_youtube,
        Icon: YouTubeMusicIcon,
        accentBorder: "hover:border-youtube",
        buttonBg: "bg-youtube",
        glow: "rgba(255, 0, 0, 0.45)",
      },
    ].filter((p) => Boolean(p.url));

    if (!isAfricanFan) return all;

    // Local-market priority: fans detected in supported markets see
    // Audiomack and Boomplay bubbled to the top of the stack.
    const localFirst = ["audiomack", "boomplay"];
    return [...all].sort((a, b) => {
      const aLocal = localFirst.includes(a.key);
      const bLocal = localFirst.includes(b.key);
      if (aLocal && !bLocal) return -1;
      if (!aLocal && bLocal) return 1;
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
  // Stronger, more saturated artwork-driven tint — this is the page's main
  // source of "excitement": the mood shifts with the cover art itself,
  // the way Spotify/Apple's adaptive players do, rather than a flat block.
  const bgStyle = avgColor
    ? {
        backgroundImage: `radial-gradient(circle at 50% 0%, rgba(${avgColor}, 0.55), transparent 62%), radial-gradient(circle at 50% 100%, rgba(${avgColor}, 0.32), transparent 75%)`,
        transition: "background-image 700ms ease",
      }
    : undefined;

  return (
    <div
      className="relative min-h-[100dvh] bg-base-bg flex items-center justify-center px-4 py-8 sm:py-10 overflow-hidden"
      style={bgStyle}
    >
      <div className="light-streaks" aria-hidden="true" />
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={`Stream or pre-save "${smartlink.track_title}" by ${smartlink.artist_name} on Audiomack, Boomplay, Spotify, Apple Music, and YouTube Music.`}
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:image" content={smartlink.artwork_url} />
      </Head>

      <div className="relative z-10 w-full max-w-sm glass-card rounded-xl2 shadow-glass p-5 sm:p-6">
        <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-5 bg-base-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImageUrl}
            alt={`${smartlink.track_title} artwork`}
            className="w-full h-full object-cover"
            loading="eager"
            width={600}
            height={600}
          />
          {gallery.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur px-2 py-1 rounded-full">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`Show cover image ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    i === activeImage ? "bg-brand w-4" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-center mb-6 min-h-[4.5rem]">
          <h1 className="text-xl font-extrabold text-white leading-tight break-words">
            {smartlink.track_title}
          </h1>
          <p className="text-base-muted text-sm font-medium mt-1 break-words">
            {smartlink.artist_name}
          </p>
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
              style={{ "--glow-color": platform.glow }}
              className={`glow-on-hover w-full flex items-center gap-3 bg-base-bg border border-base-border rounded-xl px-3.5 sm:px-4 py-3 ${platform.accentBorder}`}
            >
              <platform.Icon />
              <span className="flex-1 min-w-0 text-left text-sm font-semibold text-white truncate">
                {platform.label}
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg text-base-bg shrink-0 ${platform.buttonBg}`}
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
            className="mt-6 flex flex-wrap items-center justify-center gap-1.5 text-center text-xs text-base-muted hover:text-white transition"
          >
            <SampleFmMark />
            Powered by <span className="font-semibold text-white">Sample.fm</span> — Create Your
            Own Free Artist SmartLink
          </a>
        )}
      </div>

      {presaveModalOpen && pendingPlatform && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm glass-card rounded-xl2 p-5 sm:p-6 relative animate-fade-in">
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
                <h2 className="text-lg font-bold text-white mb-1 pr-6">
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
                  {submitError && <p className="text-sm text-red-400 break-words">{submitError}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full text-base-bg font-bold rounded-lg py-2.5 text-sm transition disabled:opacity-60 ${pendingPlatform.buttonBg}`}
                  >
                    {submitting ? "Submitting…" : "Confirm Pre-Save"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">✓</div>
                <h2 className="text-lg font-bold text-white mb-1">You&apos;re all set!</h2>
                <p className="text-sm text-base-muted mb-5">
                  We&apos;ll notify {pendingPlatform.label} to deliver {smartlink.track_title}{" "}
                  straight to your library the moment it drops.
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
