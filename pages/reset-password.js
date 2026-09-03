import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (!router.isReady || !router.query.token) {
      setError("This reset link is missing its token. Please use the link from your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: router.query.token, password }),
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
        <title>Set a new password — Sample.fm</title>
      </Head>

      <div className="relative z-10 glass-card rounded-xl2 p-8 shadow-glass max-w-sm w-full">
        {done ? (
          <>
            <h1 className="text-xl font-bold mb-2">Password reset</h1>
            <p className="text-base-muted text-sm mb-6">
              Your password has been updated. You can sign in with it now.
            </p>
            <Link
              href="/"
              className="block text-center w-full bg-brand hover:bg-brand-dark transition text-white font-semibold rounded-lg py-2.5 text-sm"
            >
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-1">Set a new password</h1>
            <p className="text-base-muted text-sm mb-6">Choose a new password for your account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5" htmlFor="password">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5" htmlFor="confirm-password">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
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
                {loading ? "Saving…" : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
