import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState("register"); // "register" | "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-base-bg text-white overflow-hidden">
      <div className="light-streaks" aria-hidden="true" />
      <Head>
        <title>Sample.fm — SmartLinks &amp; Pre-Saves for Independent Music Creators</title>
        <meta
          name="description"
          content="Sample.fm is the elite SmartLink and pre-save platform built for independent music creators and labels, with Paystack billing built in."
        />
      </Head>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-base-border text-xs text-base-muted">
            <span className="w-2 h-2 rounded-full bg-brand" />
            Built for independent creators
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            One link.
            <br />
            Every platform.
            <br />
            <span className="text-brand">Every fan, everywhere.</span>
          </h1>
          <p className="text-base-muted text-lg mb-8 max-w-md">
            Sample.fm gives independent artists and labels a single SmartLink
            for Audiomack, Boomplay, Spotify, Apple Music and YouTube — with
            pre-saves, retargeting pixels, and fan analytics built in.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md text-sm">
            <div className="glass-card rounded-xl p-4">
              <div className="text-brand font-bold text-2xl mb-1">Free</div>
              <div className="text-base-muted">Unlimited SmartLinks, basic analytics</div>
            </div>
            <div className="glass-card rounded-xl p-4 border-brand/40">
              <div className="text-brand-light font-bold text-2xl mb-1">$16/mo</div>
              <div className="text-base-muted">
                Pixels, custom domains, no Sample.fm branding
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl2 p-8 shadow-glass">
          <div className="flex mb-6 rounded-lg bg-base-card border border-base-border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${
                mode === "register" ? "bg-brand text-white" : "text-base-muted hover:text-white"
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${
                mode === "login" ? "bg-brand text-white" : "text-base-muted hover:text-white"
              }`}
            >
              Sign In
            </button>
          </div>

          <h2 className="text-xl font-bold mb-1">
            {mode === "register" ? "Start your Creator account" : "Welcome back"}
          </h2>
          <p className="text-base-muted text-sm mb-6">
            {mode === "register"
              ? "Free forever. Upgrade any time for $16/mo."
              : "Sign in to manage your SmartLinks."}
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
            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5" htmlFor="password">
                Password
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
              {loading
                ? "Please wait…"
                : mode === "register"
                ? "Create my free account"
                : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center text-base-muted text-xs pb-10">
        Sample.fm — SmartLinks &amp; pre-saves engineered for independent music creators.
      </footer>
    </div>
  );
}
