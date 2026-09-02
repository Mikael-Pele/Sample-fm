import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

// Paystack redirects here after checkout. We verify the payment
// server-side and send the user on to their dashboard — this page is just
// the "hang tight" moment in between.
export default function BillingCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed

  useEffect(() => {
    if (!router.isReady) return;
    const reference = router.query.reference || router.query.trxref;

    if (!reference) {
      setStatus("failed");
      return;
    }

    fetch(`/api/billing/verify?reference=${encodeURIComponent(reference)}`)
      .then((res) => res.json())
      .then((data) => setStatus(data.success ? "success" : "failed"))
      .catch(() => setStatus("failed"));
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => router.push("/dashboard#billing"), 1800);
    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <div className="min-h-screen bg-base-bg text-white flex items-center justify-center px-4">
      <Head>
        <title>Confirming your payment — Sample.fm</title>
      </Head>
      <div className="glass-card rounded-xl2 p-8 max-w-sm w-full text-center">
        {status === "verifying" && (
          <>
            <div className="text-lg font-semibold mb-2">Confirming your payment…</div>
            <p className="text-base-muted text-sm">This only takes a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-lg font-semibold mb-2 text-brand-light">You&rsquo;re on Premium</div>
            <p className="text-base-muted text-sm">Taking you back to your dashboard…</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="text-lg font-semibold mb-2 text-red-400">
              We couldn&rsquo;t confirm that payment
            </div>
            <p className="text-base-muted text-sm mb-5">
              If you were charged, it can take a minute to reflect — check your dashboard shortly.
              If it still hasn&rsquo;t updated, use &ldquo;Report a problem&rdquo; and we&rsquo;ll sort it out.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard#billing")}
              className="bg-brand hover:bg-brand-dark transition text-white font-semibold rounded-lg px-5 py-2.5 text-sm"
            >
              Back to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
