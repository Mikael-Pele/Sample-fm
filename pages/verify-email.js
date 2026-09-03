import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";

export default function VerifyEmail() {
  const router = useRouter();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const { token } = router.query;

    if (!token) {
      setStatus("failed");
      setError("This verification link is missing its token.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setStatus("failed");
          setError(data.error || "Could not verify your email.");
          return;
        }
        setStatus("success");
      })
      .catch(() => {
        setStatus("failed");
        setError("Network error. Please try again.");
      });
  }, [router.isReady, router.query]);

  return (
    <div className="relative min-h-screen bg-base-bg text-white overflow-hidden flex items-center justify-center px-4">
      <div className="light-streaks" aria-hidden="true" />
      <Head>
        <title>Verify your email — Droppa.fm</title>
      </Head>

      <div className="relative z-10 glass-card rounded-xl2 p-8 shadow-glass max-w-sm w-full text-center">
        {status === "verifying" && (
          <>
            <div className="text-lg font-semibold mb-2">Verifying your email…</div>
            <p className="text-base-muted text-sm">This only takes a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-lg font-semibold mb-2 text-brand-light">Email verified</div>
            <p className="text-base-muted text-sm mb-6">You&rsquo;re all set.</p>
            <Link
              href="/dashboard"
              className="block text-center w-full bg-brand hover:bg-brand-dark transition text-white font-semibold rounded-lg py-2.5 text-sm"
            >
              Go to dashboard
            </Link>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="text-lg font-semibold mb-2 text-red-400">Couldn&rsquo;t verify that link</div>
            <p className="text-base-muted text-sm mb-6">{error}</p>
            <Link
              href="/dashboard"
              className="block text-center w-full bg-brand hover:bg-brand-dark transition text-white font-semibold rounded-lg py-2.5 text-sm"
            >
              Go to dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
