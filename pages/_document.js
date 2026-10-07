import { Html, Head, Main, NextScript } from "next/document";

// Custom Document: Next.js's Pages Router does NOT inject a responsive
// viewport meta tag automatically. Without it, mobile browsers fall back to
// a fixed ~980px desktop layout width and try to shrink/reflow the page to
// fit — which is what caused text and containers to visibly shift position
// between portrait and landscape on phones. This fixes that at the root.
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0A0A0C" />

        {/* PWA: lets a fan or creator "install" Droppa.fm straight from the
            browser (Android/desktop Chrome get a real install prompt; iOS
            Safari needs the manual Share → Add to Home Screen flow, which
            InstallAppPrompt.js walks them through). */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Droppa.fm" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
