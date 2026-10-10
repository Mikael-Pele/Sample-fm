import { useState } from "react";
import { StatTile } from "./DashboardOverview";
import { Field, ErrorNote, INPUT_CLASS, PrimaryButton, SecondaryButton, ReadOnlyNotice, requestJson } from "./DashboardForms";

const CURRENCIES = ["GHS", "USD", "GBP", "EUR", "NGN"];
const EMPTY = { distributor: "", amount: "", currency: "GHS", period: "", status: "paid", note: "" };

export function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch (err) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

// Sums per currency, since a GHS payment and a USD payment can't be added.
function totalsByCurrency(payouts, status) {
  const totals = {};
  for (const p of payouts) {
    if (status && p.status !== status) continue;
    totals[p.currency] = (totals[p.currency] || 0) + p.amount;
  }
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

function totalsText(entries) {
  return entries.length === 0 ? formatMoney(0, "GHS") : entries.map(([c, v]) => formatMoney(v, c)).join(" + ");
}

// Manual royalty log. Nothing here talks to a distributor; the artist
// types in each payment from their statements.
export default function PayoutsPage({ payouts, onChange, canEdit, onUpgrade }) {
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const received = totalsByCurrency(payouts, "paid");
  const pending = totalsByCurrency(payouts, "pending");

  const byDistributor = Object.values(
    payouts.reduce((acc, p) => {
      const key = `${p.distributor}|${p.currency}`;
      acc[key] = acc[key] || { distributor: p.distributor, currency: p.currency, paid: 0, pending: 0, count: 0 };
      acc[key][p.status] += p.amount;
      acc[key].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.paid + b.pending - (a.paid + a.pending));

  function update(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      distributor: p.distributor,
      amount: String(p.amount),
      currency: p.currency,
      period: p.period,
      status: p.status,
      note: p.note || "",
    });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await requestJson(editingId ? `/api/payouts/${editingId}` : "/api/payouts", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onChange(editingId ? payouts.map((p) => (p.id === editingId ? data.payout : p)) : [data.payout, ...payouts]);
      // Keep distributor and currency for logging several months in a row.
      setEditingId(null);
      setForm({ ...EMPTY, distributor: form.distributor, currency: form.currency });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete the ${formatMoney(p.amount, p.currency)} payment from ${p.distributor}?`)) return;
    try {
      await requestJson(`/api/payouts/${p.id}`, { method: "DELETE" });
      onChange(payouts.filter((x) => x.id !== p.id));
      if (editingId === p.id) cancelEdit();
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="space-y-5">
      {!canEdit && <ReadOnlyNotice onUpgrade={onUpgrade} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label="Total received" value={totalsText(received)} />
        <StatTile label="Pending" value={totalsText(pending)} />
        <StatTile label="Payments logged" value={payouts.length} />
        <StatTile label="Distributors" value={new Set(payouts.map((p) => p.distributor)).size} />
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl2 p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold">{editingId ? "Edit payment" : "Log a payment"}</h2>
          <p className="text-xs text-base-muted mt-0.5">
            Copy the figures from your distributor statement. Droppa doesn&apos;t connect to distributors.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Distributor" htmlFor="payout-distributor">
            <input id="payout-distributor" name="distributor" value={form.distributor} onChange={update} required maxLength={80} placeholder="DistroKid" disabled={!canEdit} className={INPUT_CLASS} />
          </Field>
          <Field label="Amount" htmlFor="payout-amount">
            <div className="flex gap-2">
              <select name="currency" aria-label="Currency" value={form.currency} onChange={update} disabled={!canEdit} className={`${INPUT_CLASS.replace("w-full", "w-[84px]")} shrink-0 px-2.5`}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input id="payout-amount" name="amount" type="number" min="0" step="0.01" inputMode="decimal" value={form.amount} onChange={update} required placeholder="0.00" disabled={!canEdit} className={`${INPUT_CLASS} min-w-0`} />
            </div>
          </Field>
          <Field label="Period" htmlFor="payout-period">
            <input id="payout-period" name="period" value={form.period} onChange={update} required maxLength={40} placeholder="September 2026" disabled={!canEdit} className={INPUT_CLASS} />
          </Field>
          <Field label="Status" htmlFor="payout-status">
            <select id="payout-status" name="status" value={form.status} onChange={update} disabled={!canEdit} className={INPUT_CLASS}>
              <option value="paid">Received</option>
              <option value="pending">Pending</option>
            </select>
          </Field>
          <Field label="Note (optional)" htmlFor="payout-note" className="sm:col-span-2 lg:col-span-4">
            <input id="payout-note" name="note" value={form.note} onChange={update} maxLength={280} placeholder="Which releases, platforms or anything else to remember" disabled={!canEdit} className={INPUT_CLASS} />
          </Field>
        </div>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex gap-3">
          <PrimaryButton type="submit" disabled={saving || !canEdit}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Log payment"}
          </PrimaryButton>
          {editingId && (
            <SecondaryButton type="button" onClick={cancelEdit}>
              Cancel
            </SecondaryButton>
          )}
        </div>
      </form>

      {byDistributor.length > 0 && (
        <section className="glass-card rounded-xl2 overflow-hidden">
          <h2 className="font-bold text-sm px-4 sm:px-5 py-3 border-b border-base-border">By distributor</h2>
          <div className="divide-y divide-base-border/60">
            {byDistributor.map((d) => (
              <div key={`${d.distributor}-${d.currency}`} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{d.distributor}</div>
                  <div className="text-xs text-base-muted">
                    {d.count} payment{d.count === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold tabular-nums">{formatMoney(d.paid, d.currency)}</div>
                  {d.pending > 0 && (
                    <div className="text-xs text-amber-400 tabular-nums">{formatMoney(d.pending, d.currency)} pending</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass-card rounded-xl2 overflow-hidden">
        <h2 className="font-bold text-sm px-4 sm:px-5 py-3 border-b border-base-border">History</h2>
        {payouts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-base-muted">No payments logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-base-muted text-xs uppercase tracking-wide">
                  <th className="px-4 sm:px-5 py-2.5 font-semibold">Period</th>
                  <th className="px-3 py-2.5 font-semibold">Distributor</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Amount</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Note</th>
                  <th className="px-4 sm:px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-t border-base-border/60">
                    <td className="px-4 sm:px-5 py-3 whitespace-nowrap">{p.period}</td>
                    <td className="px-3 py-3 font-semibold">{p.distributor}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums whitespace-nowrap">{formatMoney(p.amount, p.currency)}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-semibold ${p.status === "pending" ? "text-amber-400" : "text-emerald-400"}`}>
                        {p.status === "pending" ? "Pending" : "Received"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-base-muted max-w-[240px] truncate">{p.note || ""}</td>
                    <td className="px-4 sm:px-5 py-3 text-right whitespace-nowrap">
                      {canEdit && (
                        <button type="button" onClick={() => startEdit(p)} className="text-xs font-semibold text-brand-light hover:text-brand mr-4">
                          Edit
                        </button>
                      )}
                      <button type="button" onClick={() => handleDelete(p)} className="text-xs font-semibold text-base-muted hover:text-red-400">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
