import Head from "next/head";
import Link from "next/link";

const EFFECTIVE_DATE = "September 2, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-base-bg text-white">
      <Head>
        <title>Terms of Use — Sample.fm</title>
      </Head>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-brand-light hover:text-brand transition">
          ← Back to Sample.fm
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2">Terms of Use</h1>
        <p className="text-sm text-base-muted mb-10">Effective {EFFECTIVE_DATE}</p>

        <div className="space-y-8 text-sm leading-relaxed text-base-muted">
          <section>
            <h2 className="text-white font-bold text-lg mb-2">1. Agreement</h2>
            <p>
              By creating an account or using Sample.fm, you agree to these Terms of Use. If you
              don&apos;t agree, please don&apos;t use the service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">2. What Sample.fm is</h2>
            <p>
              Sample.fm lets creators build a single SmartLink page linking out to their music
              across streaming platforms, collect fan pre-saves, and view click analytics. Free
              and paid (Premium) tiers are available, as described on our pricing page.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">3. Your account</h2>
            <p>
              You&apos;re responsible for keeping your login credentials secure and for all
              activity under your account. You must provide accurate information when you sign
              up.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">4. Acceptable use</h2>
            <p className="mb-2">You agree not to use Sample.fm to:</p>
            <p>
              upload content you don&apos;t have the rights to; impersonate another person or
              artist; distribute malware or spam; collect fan data for purposes other than the
              release you&apos;re promoting; or attempt to disrupt, reverse-engineer, or abuse the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">5. Your content</h2>
            <p>
              You retain ownership of the artist names, artwork, and links you upload. By
              uploading content, you grant Sample.fm a limited license to host and display it as
              part of operating the service. You&apos;re solely responsible for having the rights
              to any cover art or content you upload.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">6. Fan pre-saves</h2>
            <p>
              If you collect fan emails through pre-saves, you agree to use them only for
              communicating about the release fans signed up for, and to comply with applicable
              email and data protection laws in how you use that data outside Sample.fm.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">7. Billing</h2>
            <p>
              Paid plans are billed through Paystack on the cycle you select at checkout. Fees are
              non-refundable except where required by law. You can cancel a paid plan at any
              time; access continues until the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">8. Termination</h2>
            <p>
              You may delete your SmartLinks or stop using Sample.fm at any time. We may suspend
              or terminate accounts that violate these Terms or applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">9. Service &quot;as is&quot;</h2>
            <p>
              Sample.fm is provided on an &quot;as is&quot; and &quot;as available&quot; basis,
              without warranties of any kind. We don&apos;t guarantee uninterrupted or error-free
              service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">10. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Sample.fm is not liable for indirect,
              incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">11. Changes</h2>
            <p>
              We may update these Terms from time to time. Continued use of Sample.fm after
              changes take effect means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">12. Contact</h2>
            <p>Questions about these Terms? Reach us via the &quot;Report a problem&quot; link on the site.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
