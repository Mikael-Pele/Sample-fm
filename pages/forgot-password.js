import { useState } from "react";
import Link from "next/link";
import Head from "next/head";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setDone(true);
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-base-bg text-white overflow-hidden flex items-center justify-center px-4">
      <div className="light-streaks" aria-hidden="true" />
      <Head>
        <title>Reset your password — Sample.fm</title>
      </Head>

      <div className="relative z-10 glass-card rounded-xl2 p-8 shadow-glass max-w-sm w-full">
        {done ? (
          <>
            <h1 className="text-xl font-bold mb-2">Check your email</h1>
            <p className="text-base-muted text-sm mb-6">
              If an account exists for that email, we&rsquo;ve sent a link to reset your password. It expires in
              30 minutes.
            </p>
            <Link
              href="/"
              className="block text-center w-full bg-brand hover:bg-brand-dark transition text-white font-semibold rounded-lg py-2.5 text-sm"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-1">Reset your password</h1>
            <p className="text-base-muted text-sm mb-6">
              Enter the email on your account and we&rsquo;ll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourlabel.com"
                  className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                />
              </div>

              {error ? (
                <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 transition text-white font-semibold rounded-lg py-2.5 text-sm"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>

              <p className="text-center">
                <Link href="/" className="text-xs text-base-muted hover:text-white transition">
                  Back to sign in
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
