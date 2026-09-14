import Head from "next/head";
import Link from "next/link";
import { ReportProblemTrigger } from "../components/ReportProblemModal";

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-base-bg text-white">
      <Head>
        <title>Customer Feedback — Droppa.fm</title>
        <meta
          name="description"
          content="Get in touch with Droppa.fm — report a problem, ask a question, or share feedback on the SmartLink platform."
        />
      </Head>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-brand-light hover:text-brand transition">
          ← Back to Droppa.fm
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2">Customer Feedback</h1>
        <p className="text-sm text-base-muted mb-10">
          Droppa.fm is an early-stage platform, actively used and shaped by the creators on it.
          Every report, question, and suggestion goes straight to our team — here&apos;s how to
          reach us.
        </p>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-white font-bold mb-2">Report a problem</h2>
            <p className="text-sm leading-relaxed text-base-muted mb-4">
              Found a bug, a broken link, or something that doesn&apos;t look right? Tell us and
              we&apos;ll look into it.
            </p>
            <ReportProblemTrigger className="inline-block bg-brand hover:bg-brand-dark transition text-base-bg font-bold rounded-lg px-4 py-2 text-sm" />
          </div>

          <div className="glass-card rounded-xl p-5">
            <h2 className="text-white font-bold mb-2">Questions about billing or features</h2>
            <p className="text-sm leading-relaxed text-base-muted">
              Check our{" "}
              <Link href="/faq" className="text-brand-light hover:text-brand transition">
                FAQ
              </Link>{" "}
              first — it covers pricing, cancellations, and how SmartLinks work. Still stuck? Use
              the report form above; it reaches the same inbox.
            </p>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h2 className="text-white font-bold mb-2">General feedback &amp; feature requests</h2>
            <p className="text-sm leading-relaxed text-base-muted">
              Building for independent creators means the roadmap is shaped by what they actually
              need. If there&apos;s a feature you&apos;d like to see, use the same report form —
              it doesn&apos;t have to be a bug.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
