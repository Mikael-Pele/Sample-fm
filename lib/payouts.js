import { cleanText } from "./fieldClean";

export const PAYOUT_CURRENCIES = ["GHS", "USD", "GBP", "EUR", "NGN"];
export const PAYOUT_STATUSES = ["paid", "pending"];

export function validatePayout(body) {
  const payload = body || {};
  const distributor = cleanText(payload.distributor, 80);
  if (!distributor) return { error: "Add the distributor or source of this payment." };

  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999) {
    return { error: "Amount must be a number of 0 or more." };
  }

  const period = cleanText(payload.period, 40);
  if (!period) return { error: "Add the period this payment covers, like September 2026." };

  const currency = PAYOUT_CURRENCIES.includes(payload.currency) ? payload.currency : "GHS";
  const status = PAYOUT_STATUSES.includes(payload.status) ? payload.status : "paid";

  return {
    data: {
      distributor,
      amount: Math.round(amount * 100) / 100,
      currency,
      period,
      status,
      note: cleanText(payload.note, 280),
    },
  };
}

export function serializePayout(payout) {
  return {
    id: payout.id,
    distributor: payout.distributor,
    amount: Number(payout.amount),
    currency: payout.currency,
    period: payout.period,
    status: payout.status,
    note: payout.note,
    created_at: payout.created_at.toISOString(),
  };
}
