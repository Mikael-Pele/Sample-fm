import Head from "next/head";
import Link from "next/link";

const FAQS = [
  {
    q: "What is Droppa.fm?",
    a: "A SmartLink and pre-save platform. You create one page for a release, and it links out to every streaming platform your fans use — Audiomack, Boomplay, Spotify, Apple Music, YouTube Music, Deezer, Tidal, SoundCloud, Pandora, and iHeartRadio.",
  },
  {
    q: "Is there a free plan?",
    a: "Every new account gets a 14-day free trial with everything unlocked, and no card is needed to start. After that, Droppa.fm Artist is one yearly plan. If you don't subscribe, your existing SmartLinks stay live, but you'll need a subscription to create or edit links and to see your full analytics and fan emails.",
  },
  {
    q: "How much does Droppa.fm Artist cost?",
    a: "$49 a year, the same price for everyone wherever you are. It's charged in Ghana cedis (GH₵550) through Paystack, and your bank converts it if your card is in another currency. This is a founding-artist price: if you join now, you keep it for as long as you stay subscribed.",
  },
  {
    q: "How do I pay, and is it secure?",
    a: "All paid plans are billed through Paystack, a licensed payment processor. Your card details are entered directly on Paystack's secure checkout — Droppa.fm never sees or stores them.",
  },
  {
    q: "Does it renew automatically, and can I cancel?",
    a: "Your plan covers one year from the day you pay and doesn't renew automatically, so there's nothing to cancel. If you don't pay again, your plan stays active until the end of the year you paid for. See our Refund & Cancellation Policy for full details.",
  },
  {
    q: "Can I use my own domain or ad pixels?",
    a: "Custom domains, Facebook and TikTok pixels, and team logins for managers and labels are coming soon. Until then, your droppa.fm/yourname link works everywhere.",
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
    <div className="min-h-screen bg-base-bg text-fg">
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
              <h2 className="text-fg font-bold mb-2">{item.q}</h2>
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
