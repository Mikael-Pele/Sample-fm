import { useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import ThemeToggle from "../components/ThemeToggle";

// These pages place the theme toggle in their own header; every other page
// gets a floating one in the top-right corner.
const PAGES_WITH_OWN_TOGGLE = new Set(["/", "/dashboard", "/[slug]"]);

export default function DroppaFmApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the site works identically without it, it just
        // loses the "installable as an app" affordance.
      });
    }
  }, []);

  return (
    <>
      <Component {...pageProps} />
      {!PAGES_WITH_OWN_TOGGLE.has(router.pathname) && (
        <ThemeToggle className="fixed top-4 right-4 z-40 backdrop-blur" />
      )}
    </>
  );
}
