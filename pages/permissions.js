import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "samplefm_consent_marketing";

export default function PermissionsPage() {
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (stored !== null) setMarketingConsent(stored === "true");
    } catch (err) {
      // localStorage unavailable (private browsing, etc.) — default stands.
    }
  }, []);

  function handleSave() {
    try {
      window.localStorage.setItem(CONSENT_KEY, String(marketingConsent));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      // Nothing we can do if storage is blocked — fail silently.
    }
  }

  return (
    <div className="min-h-screen bg-base-bg text-white">
      <Head>
        <title>Manage Permissions — Sample.fm</title>
      </Head>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-brand-light hover:text-brand transition">
          ← Back to Sample.fm
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2">Manage Permissions</h1>
        <p className="text-sm text-base-muted mb-10">
          Control what Sample.fm is allowed to use on your device.
        </p>

        <div className="space-y-4">
          <div className="glass-card rounded-xl2 p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-semibold text-sm mb-1">Essential</div>
              <p className="text-sm text-base-muted">
                Keeps you signed in and remembers your session. Required for Sample.fm to
                function, and can&apos;t be turned off.
              </p>
            </div>
            <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-base-card text-base-muted border border-base-border">
              Always on
            </span>
          </div>

          <div className="glass-card rounded-xl2 p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-semibold text-sm mb-1">Product analytics</div>
              <p className="text-sm text-base-muted">
                Click and pre-save counts on your own SmartLinks, so you can see how your
                releases are performing. This is core to the product and isn&apos;t shared with
                third parties, so it isn&apos;t a toggle here — see our{" "}
                <Link href="/privacy" className="text-brand-light hover:text-brand transition">
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>
            </div>
            <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-base-card text-base-muted border border-base-border">
              Always on
            </span>
          </div>

          <div className="glass-card rounded-xl2 p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-semibold text-sm mb-1">Marketing &amp; retargeting</div>
              <p className="text-sm text-base-muted">
                Some creators may add their own Facebook or TikTok retargeting pixels to their
                SmartLinks (a Premium feature). This setting controls whether those third-party
                pixels are allowed to run when you visit a SmartLink page.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={marketingConsent}
              onClick={() => setMarketingConsent((v) => !v)}
              className={`shrink-0 w-12 h-7 rounded-full relative transition ${
                marketingConsent ? "bg-brand" : "bg-base-card border border-base-border"
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition ${
                  marketingConsent ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="mt-6 bg-brand hover:bg-brand-dark transition text-base-bg font-bold rounded-lg px-6 py-2.5 text-sm"
        >
          Save preferences
        </button>
        {saved && <p className="text-sm text-emerald-400 mt-3">Saved.</p>}

        <p className="text-xs text-base-muted mt-8">
          This preference is stored on this device only. If you clear your browser data,
          you&apos;ll be asked again.
        </p>
      </div>
    </div>
  );
}
