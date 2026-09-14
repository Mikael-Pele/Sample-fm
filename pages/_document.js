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
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
