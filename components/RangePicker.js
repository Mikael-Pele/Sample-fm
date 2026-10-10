import { useState } from "react";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function formatDay(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "over the last 30 days" / "from 3 Mar 2026 to 4 Apr 2026", from the
// range the API actually answered for.
export function rangeDescription(analytics, fallbackDays) {
  if (analytics && analytics.range_custom) {
    return `from ${formatDay(analytics.range_start)} to ${formatDay(analytics.range_end)}`;
  }
  return `over the last ${analytics ? analytics.range_days : fallbackDays} days`;
}

// Preset day ranges plus a "Custom" option with start and end dates.
// `range` is a number of days or "custom"; `customRange` is the applied
// { from, to } (YYYY-MM-DD), or null.
export default function RangePicker({ ranges, range, onRangeChange, customRange, onCustomRangeChange, error }) {
  const [draft, setDraft] = useState(customRange || { from: isoDaysAgo(29), to: todayIso() });
  const isCustom = range === "custom";

  function apply(e) {
    e.preventDefault();
    if (!draft.from || !draft.to) return;
    onCustomRangeChange(draft);
  }

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-2 min-w-0">
      <div role="group" aria-label="Date range" className="flex flex-wrap bg-base-bg border border-base-border rounded-lg p-0.5">
        {[...ranges, "custom"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onRangeChange(value)}
            aria-pressed={range === value}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
              range === value ? "bg-brand text-white" : "text-base-muted hover:text-fg"
            }`}
          >
            {value === "custom" ? "Custom" : `${value}d`}
          </button>
        ))}
      </div>
      {isCustom && (
        <form onSubmit={apply} className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="range-from">
            Start date
          </label>
          <input
            id="range-from"
            type="date"
            value={draft.from}
            max={draft.to || todayIso()}
            onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            className="bg-base-bg border border-base-border rounded-lg px-2.5 py-1.5 text-xs text-fg outline-none focus:border-brand transition"
          />
          <span className="text-xs text-base-muted">to</span>
          <label className="sr-only" htmlFor="range-to">
            End date
          </label>
          <input
            id="range-to"
            type="date"
            value={draft.to}
            min={draft.from || undefined}
            max={todayIso()}
            onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            className="bg-base-bg border border-base-border rounded-lg px-2.5 py-1.5 text-xs text-fg outline-none focus:border-brand transition"
          />
          <button type="submit" className="bg-brand hover:bg-brand-dark transition text-white text-xs font-bold rounded-lg px-3 py-1.5">
            Apply
          </button>
        </form>
      )}
      {isCustom && error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
