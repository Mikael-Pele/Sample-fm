import { useEffect } from "react";
import "../styles/globals.css";

export default function DroppaFmApp({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the site works identically without it, it just
        // loses the "installable as an app" affordance.
      });
    }
  }, []);

  return <Component {...pageProps} />;
}
