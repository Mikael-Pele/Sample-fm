// Small form pieces shared by the Releases, Payouts and EPK pages, styled
// the same way as the SmartLink form.
export const INPUT_CLASS =
  "w-full bg-base-bg border border-base-border rounded-lg px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand transition disabled:opacity-60";

export function Field({ label, htmlFor, hint, children, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-base-muted mb-1.5">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-base-muted mt-1">{hint}</p> : null}
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2 break-words">
      {children}
    </div>
  );
}

export function SuccessNote({ children }) {
  if (!children) return null;
  return (
    <div className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2 break-words">
      {children}
    </div>
  );
}

// Shown above a page's form when the trial has ended: data stays visible,
// changes need a subscription.
export function ReadOnlyNotice({ onUpgrade }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-base-card border border-base-border rounded-xl px-4 py-3">
      <p className="text-sm text-base-muted">
        Your free trial has ended. You can still see everything here, but you need a subscription to make changes.
      </p>
      <button
        type="button"
        onClick={onUpgrade}
        className="bg-brand hover:bg-brand-dark transition text-white text-xs font-bold rounded-lg px-4 py-2"
      >
        Subscribe
      </button>
    </div>
  );
}

export function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="bg-brand hover:bg-brand-dark disabled:opacity-60 transition text-white font-semibold rounded-lg px-4 py-2.5 text-sm"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="bg-base-card border border-base-border hover:border-base-muted disabled:opacity-60 transition text-fg font-semibold rounded-lg px-4 py-2.5 text-sm"
    >
      {children}
    </button>
  );
}

// Fetch helper: returns parsed JSON and throws an Error carrying the API's
// own message on a non-2xx response.
export async function requestJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json", ...(options.headers || {}) } : options.headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
