import Head from "next/head";
import Link from "next/link";

const EFFECTIVE_DATE = "September 2, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-base-bg text-white">
      <Head>
        <title>Privacy Policy — Sample.fm</title>
      </Head>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-brand-light hover:text-brand transition">
          ← Back to Sample.fm
        </Link>
        <h1 className="text-3xl font-extrabold mt-4 mb-2">Privacy Policy</h1>
        <p className="text-sm text-base-muted mb-10">Effective {EFFECTIVE_DATE}</p>

        <div className="space-y-8 text-sm leading-relaxed text-base-muted">
          <section>
            <h2 className="text-white font-bold text-lg mb-2">1. What this covers</h2>
            <p>
              This Privacy Policy explains how Sample.fm (&quot;Sample.fm&quot;, &quot;we&quot;,
              &quot;us&quot;) collects, uses, and protects information when you use our SmartLink
              and pre-save platform — whether you&apos;re a creator with an account or a fan
              visiting a SmartLink page.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">2. Information we collect</h2>
            <p className="mb-2">
              <strong className="text-white">Account information.</strong> If you sign up as a
              creator, we collect your email address and a securely hashed password. We never
              store your password in plain text.
            </p>
            <p className="mb-2">
              <strong className="text-white">SmartLink content.</strong> Artist names, track
              titles, release dates, cover art, and the streaming platform links you add to your
              SmartLinks.
            </p>
            <p className="mb-2">
              <strong className="text-white">Fan information.</strong> When a fan submits their
              email to pre-save a release, we store that email, the release it relates to, and
              the streaming provider selected, so it can be shared with the creator and used to
              deliver the pre-save. Fans may optionally also provide a phone number, which is
              shared only with the creator whose release they pre-saved, so that creator can
              reach out directly (for example, to invite them to a WhatsApp fan update list).
              Providing a phone number is always optional.
            </p>
            <p>
              <strong className="text-white">Usage &amp; analytics data.</strong> When someone
              visits or clicks a SmartLink, we log the platform clicked, an approximate country
              (derived from network information, not GPS), and device type. This powers the click
              analytics shown to creators in their dashboard — it is not sold to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">3. How we use information</h2>
            <p>
              We use the information above to operate and improve Sample.fm: creating and
              displaying SmartLinks, delivering pre-saves, showing creators their own analytics,
              processing payments for paid plans, and responding to support requests submitted
              through &quot;Report a problem.&quot;
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">4. Payments</h2>
            <p>
              Paid subscriptions are processed by Paystack. Sample.fm does not receive or store
              your full card details — those are handled directly by Paystack under their own
              privacy and security practices.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">5. Cookies</h2>
            <p>
              We use a single essential cookie to keep creators signed in. We do not currently
              use third-party advertising cookies on Sample.fm pages themselves. See{" "}
              <Link href="/permissions" className="text-brand-light hover:text-brand transition">
                Manage Permissions
              </Link>{" "}
              for details and controls.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">6. Sharing</h2>
            <p>
              We do not sell personal information. Fan emails collected via pre-saves are shared
              only with the creator who owns that SmartLink. We may share information with
              service providers who help us run Sample.fm (hosting, database, storage, and
              payment processing), bound to protect it, or when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">7. Data retention &amp; deletion</h2>
            <p>
              We keep account and SmartLink data for as long as your account is active. Creators
              can permanently delete a SmartLink and its associated analytics at any time from
              their dashboard. To close your account entirely or request deletion of your data,
              use &quot;Report a problem&quot; or contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">8. Your rights</h2>
            <p>
              Depending on where you live, you may have rights to access, correct, or delete your
              personal information. Contact us and we will respond as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">9. Changes to this policy</h2>
            <p>
              We may update this policy as Sample.fm evolves. Material changes will be reflected
              by updating the effective date above.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">10. Contact</h2>
            <p>Questions about this policy? Reach us via the &quot;Report a problem&quot; link on the site.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
