import Head from "next/head";
import Link from "next/link";

const EFFECTIVE_DATE = "September 14, 2026";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-base-bg text-fg">
      <Head>
        <title>Refund &amp; Cancellation Policy — Droppa.fm</title>
      </Head>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-brand-light hover:text-brand transition">
          ← Back to Droppa.fm
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2">Refund &amp; Cancellation Policy</h1>
        <p className="text-sm text-base-muted mb-10">Effective {EFFECTIVE_DATE}</p>

        <div className="space-y-8 text-sm leading-relaxed text-base-muted">
          <section>
            <h2 className="text-fg font-bold text-lg mb-2">1. What we sell</h2>
            <p>
              Droppa.fm is a digital subscription service, not a physical product. There is no
              shipping or physical delivery — access to Droppa.fm Artist (unlimited SmartLinks, full
              analytics, fan email exports, and branding removal) is granted instantly to your account the moment your payment is confirmed by Paystack.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-bold text-lg mb-2">2. Billing cycle</h2>
            <p>
              Every new account starts with a 7-day free trial with one SmartLink, and no payment is needed. After
              that, Droppa.fm Artist costs $49 a year, charged as GH&#8373;550 through Paystack. Each
              payment covers one year from the day you pay. It does not renew automatically: you
              choose whether to pay again when the year is up.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-bold text-lg mb-2">3. Cancellations</h2>
            <p>
              Because nothing renews automatically, there is nothing to cancel. If you don&apos;t
              pay again, you keep full access until the end of the year you already paid
              for. After that, your SmartLinks stay live for fans, but you won&apos;t be able to
              create or edit links, or see your full analytics and fan emails, until you
              subscribe again.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-bold text-lg mb-2">4. Refunds</h2>
            <p>
              Because Artist plan access is granted immediately on payment, subscription fees are
              generally non-refundable. The exceptions are: a duplicate or accidental charge, a
              charge that occurred due to a verified technical error on our end, or where a refund
              is required by applicable law. To request one, use the &quot;Report a problem&quot;
              link in the footer with your account email and payment reference, and we&apos;ll
              review it. Approved refunds are issued back to the original payment method through
              Paystack.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-bold text-lg mb-2">5. Failed or disputed payments</h2>
            <p>
              If a payment fails or is disputed with your card issuer, Artist plan access is not
              granted (or is suspended if already active) until the payment is resolved.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-bold text-lg mb-2">6. Contact</h2>
            <p>
              Billing questions? Reach us via the &quot;Report a problem&quot; link on the site, or
              see our <Link href="/faq" className="text-brand-light hover:text-brand transition">FAQ</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
