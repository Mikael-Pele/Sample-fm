import { useEffect } from "react";
import { BUSINESS_FEATURES } from "./DashboardLayout";
import { SUPPORT_WHATSAPP_URL } from "../lib/support";

const BUSINESS_CONTACT_URL = `${SUPPORT_WHATSAPP_URL}?text=` + encodeURIComponent("Hi Droppa.fm, I'm interested in the Business plan.");

// Shown when an artist clicks a "For Business" item in the sidebar. Those
// pages are part of the Business tier, which isn't on sale yet.
export default function BusinessUpgradeModal({ featureKey, onClose }) {
  useEffect(() => {
    if (!featureKey) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [featureKey, onClose]);

  if (!featureKey) return null;
  const feature = BUSINESS_FEATURES.find((f) => f.key === featureKey) || BUSINESS_FEATURES[0];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-modal-title"
        className="w-full max-w-md glass-card rounded-xl2 p-5 sm:p-6 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-base-bg border border-base-border text-base-muted hover:text-fg transition"
        >
          ✕
        </button>

        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wide border border-brand text-brand rounded px-1.5 py-px mb-3">
          Pro
        </span>
        <h2 id="business-modal-title" className="text-xl font-extrabold mb-1">
          {feature.label} is part of Droppa.fm Business
        </h2>
        <p className="text-sm text-base-muted mb-5">{feature.description}</p>

        <div className="border border-base-border rounded-lg divide-y divide-base-border/60 mb-5">
          {BUSINESS_FEATURES.map((f) => (
            <div key={f.key} className="px-3.5 py-2.5">
              <div className={`text-sm font-semibold ${f.key === feature.key ? "text-fg" : "text-base-muted"}`}>{f.label}</div>
              <div className="text-xs text-base-muted">{f.summary}</div>
            </div>
          ))}
        </div>

        <p className="text-xs text-base-muted mb-4">
          The Business plan isn&apos;t available to buy yet. Message us and we&apos;ll set you up as soon as it opens.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={BUSINESS_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-brand hover:bg-brand-dark transition text-white font-semibold rounded-lg px-4 py-2.5 text-sm"
          >
            Ask about Business
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-base-card border border-base-border hover:border-base-muted transition text-fg font-semibold rounded-lg px-4 py-2.5 text-sm"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
