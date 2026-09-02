import { useState } from "react";

export function ReportProblemTrigger({ className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || "text-base-muted hover:text-white transition"}
      >
        Report a problem
      </button>
      {open && <ReportProblemModal onClose={() => setOpen(false)} />}
    </>
  );
}

export default function ReportProblemModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please describe what went wrong.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message,
          page_url: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit your report. Please try again.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch (err) {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass-card rounded-xl2 p-5 sm:p-6 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-base-bg border border-base-border text-base-muted hover:text-white transition"
        >
          ✕
        </button>

        {done ? (
          <div className="py-4 text-center">
            <p className="text-lg font-bold mb-1">Thanks — got it.</p>
            <p className="text-sm text-base-muted">
              We&apos;ve logged the issue and will look into it.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 bg-brand hover:bg-brand-dark transition text-base-bg font-bold rounded-lg px-5 py-2 text-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-1">Report a problem</h2>
              <p className="text-sm text-base-muted">
                Tell us what happened — bugs, broken links, anything odd.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5" htmlFor="report-email">
                Your email (optional)
              </label>
              <input
                id="report-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5" htmlFor="report-message">
                What went wrong?
              </label>
              <textarea
                id="report-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. My cover art won't upload on mobile"
                className="w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-brand transition resize-none"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 transition text-base-bg font-bold rounded-lg py-2.5 text-sm"
            >
              {submitting ? "Sending…" : "Send report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
