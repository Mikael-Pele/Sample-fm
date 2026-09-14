import Head from "next/head";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-base-bg text-white">
      <Head>
        <title>About — Droppa.fm</title>
        <meta
          name="description"
          content="Droppa.fm is a SmartLink and pre-save platform built for independent music creators, with pricing and billing designed around the African market."
        />
      </Head>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-brand-light hover:text-brand transition">
          ← Back to Droppa.fm
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2">About Droppa.fm</h1>
        <p className="text-sm text-base-muted mb-10">Who we are and what we do</p>

        <div className="space-y-8 text-sm leading-relaxed text-base-muted">
          <section>
            <h2 className="text-white font-bold text-lg mb-2">What we do</h2>
            <p>
              Droppa.fm is a SmartLink and pre-save platform for independent artists, labels, and
              creators. Instead of sharing a separate link for every streaming platform, a creator
              builds one Droppa.fm page that routes fans to Audiomack, Boomplay, Spotify, Apple
              Music, YouTube, and more — with pre-save collection, retargeting pixels, and click
              analytics built in.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">Who it&apos;s for</h2>
            <p>
              We built Droppa.fm specifically with independent African creators in mind, where
              existing SmartLink tools are often priced in a way that&apos;s out of reach.
              Droppa.fm offers a free tier for creators just getting started, and an affordable
              Premium tier priced for the regions we serve.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">How billing works</h2>
            <p>
              Paid subscriptions are processed securely through Paystack. We never see or store
              your card details — Paystack handles that directly. See our{" "}
              <Link href="/refund-policy" className="text-brand-light hover:text-brand transition">
                Refund &amp; Cancellation Policy
              </Link>{" "}
              for details on billing cycles and cancellations.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">Get in touch</h2>
            <p>
              Questions, feedback, or an issue to report? Use the &quot;Report a problem&quot; link
              in the footer of any page, or visit our{" "}
              <Link href="/faq" className="text-brand-light hover:text-brand transition">
                FAQ
              </Link>{" "}
              for common questions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
