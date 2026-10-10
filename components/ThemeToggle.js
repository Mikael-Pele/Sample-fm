import { useEffect, useState } from "react";

// Light/dark theme switch. The theme is a "light" class on <html>; the
// initial value is set by an inline script in pages/_document.js before
// first paint (saved choice, else the device's system setting) so there is
// no flash of the wrong theme. Once the user picks a theme here it is saved
// in localStorage and wins over the system setting on later visits.
export const THEME_STORAGE_KEY = "droppa-theme";

const THEME_COLORS = { dark: "#0A0A0C", light: "#F6F5F2" };

function currentTheme() {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function ThemeToggle({ className = "" }) {
  // null until mounted: the server can't know the theme, so render a
  // neutral placeholder first to avoid a hydration mismatch.
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    setTheme(currentTheme());

    // Follow system changes only while the user hasn't chosen explicitly.
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!media) return undefined;
    function onSystemChange(e) {
      let saved = null;
      try {
        saved = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        // Storage blocked (private mode etc.) — just follow the system.
      }
      if (saved) return;
      const next = e.matches ? "light" : "dark";
      applyTheme(next);
      setTheme(next);
    }
    media.addEventListener?.("change", onSystemChange);
    return () => media.removeEventListener?.("change", onSystemChange);
  }, []);

  function toggle() {
    const next = currentTheme() === "light" ? "dark" : "light";
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Non-fatal: the switch still works for this visit.
    }
  }

  const label = theme === "light" ? "Switch to dark theme" : "Switch to light theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-base-border bg-base-card/80 text-base-muted hover:text-fg hover:border-brand transition ${className}`}
    >
      {theme === "light" ? <MoonIcon /> : theme === "dark" ? <SunIcon /> : null}
    </button>
  );
}
