import Head from "next/head";
import Link from "next/link";

const EFFECTIVE_DATE = "September 14, 2026";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-base-bg text-white">
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
            <h2 className="text-white font-bold text-lg mb-2">1. What we sell</h2>
            <p>
              Droppa.fm is a digital subscription service, not a physical product. There is no
              shipping or physical delivery — access to Premium features (unlimited SmartLinks,
              retargeting pixels, custom domains, fan email exports, and branding removal) is
              granted instantly to your account the moment your payment is confirmed by Paystack.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">2. Billing cycle</h2>
            <p>
              Premium is billed either monthly or yearly, depending on the plan you choose at
              checkout. Your subscription automatically renews at the end of each billing period
              unless you cancel before it renews.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">3. Cancellations</h2>
            <p>
              You can cancel your Premium subscription at any time from your dashboard. When you
              cancel, you keep full Premium access until the end of the billing period you already
              paid for — we don&apos;t cut you off immediately. Your account then reverts to the
              free tier, and any SmartLinks beyond the free-tier limit remain saved but inactive
              until you either delete them or resubscribe.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">4. Refunds</h2>
            <p>
              Because Premium access is granted immediately on payment, subscription fees are
              generally non-refundable. The exceptions are: a duplicate or accidental charge, a
              charge that occurred due to a verified technical error on our end, or where a refund
              is required by applicable law. To request one, use the &quot;Report a problem&quot;
              link in the footer with your account email and payment reference, and we&apos;ll
              review it. Approved refunds are issued back to the original payment method through
              Paystack.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">5. Failed or disputed payments</h2>
            <p>
              If a payment fails or is disputed with your card issuer, Premium access is not
              granted (or is suspended if already active) until the payment is resolved.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">6. Contact</h2>
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
