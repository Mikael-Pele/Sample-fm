import Head from "next/head";
import Link from "next/link";

const FAQS = [
  {
    q: "What is Droppa.fm?",
    a: "A SmartLink and pre-save platform. You create one page for a release, and it links out to every streaming platform your fans use — Audiomack, Boomplay, Spotify, Apple Music, YouTube Music, Deezer, Tidal, SoundCloud, Pandora, and iHeartRadio.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The free tier includes up to 3 SmartLinks with basic analytics. Premium unlocks unlimited SmartLinks, retargeting pixels, custom domains, fan email exports, and removes Droppa.fm branding from your pages.",
  },
  {
    q: "How much does Premium cost?",
    a: "Pricing is shown on the homepage and adjusts automatically based on your region so it stays affordable in the markets we serve.",
  },
  {
    q: "How do I pay, and is it secure?",
    a: "All paid plans are billed through Paystack, a licensed payment processor. Your card details are entered directly on Paystack's secure checkout — Droppa.fm never sees or stores them.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel from your dashboard at any time. Your Premium features stay active until the end of the billing period you already paid for. See our Refund & Cancellation Policy for full details.",
  },
  {
    q: "Do I need a custom domain?",
    a: "No — it's optional and only available on Premium. Most creators just use their free droppa.fm/yourname link and it works fine.",
  },
  {
    q: "What happens to fan data I collect through pre-saves?",
    a: "Fan emails and phone numbers you collect belong to you, the creator. You're responsible for using them only to communicate about the release fans signed up for, in line with our Terms of Use and applicable data protection laws.",
  },
  {
    q: "How do I report a bug or problem?",
    a: "Use the \"Report a problem\" link in the footer of any page. It opens a short form that goes straight to our support inbox.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-base-bg text-white">
      <Head>
        <title>FAQ — Droppa.fm</title>
        <meta
          name="description"
          content="Frequently asked questions about Droppa.fm — pricing, billing, cancellations, and how the SmartLink platform works."
        />
      </Head>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-brand-light hover:text-brand transition">
          ← Back to Droppa.fm
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2">Frequently Asked Questions</h1>
        <p className="text-sm text-base-muted mb-10">Common questions about using Droppa.fm</p>

        <div className="space-y-6">
          {FAQS.map((item) => (
            <div key={item.q} className="glass-card rounded-xl p-5">
              <h2 className="text-white font-bold mb-2">{item.q}</h2>
              <p className="text-sm leading-relaxed text-base-muted">{item.a}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-base-muted mt-10">
          Didn&apos;t find your answer? Use the &quot;Report a problem&quot; link in the footer.
        </p>
      </div>
    </div>
  );
}
