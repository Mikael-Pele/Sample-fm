import { useState, useEffect } from "react";
import { DroppaFmMark } from "./PlatformIcons";

const DISMISS_KEY = "droppa_install_dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch (err) {}
    if (dismissed) return;

    if (isIos()) {
      setPlatform("ios");
      setVisible(true);
      return;
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("android");
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch (err) {}
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="glass-card rounded-xl2 px-4 py-3 mb-6 flex items-center gap-3">
      <DroppaFmMark size={32} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fg">Install Droppa.fm</p>
        <p className="text-xs text-base-muted">
          {platform === "ios"
            ? "Tap the Share icon, then \"Add to Home Screen.\""
            : "Add it to your home screen for one-tap access, no app store needed."}
        </p>
      </div>
      {platform === "android" && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="shrink-0 bg-brand hover:bg-brand-dark transition text-base-bg font-bold rounded-lg px-3.5 py-2 text-xs"
        >
          Install
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-base-muted hover:text-fg transition"
      >
        ✕
      </button>
    </div>
  );
}
