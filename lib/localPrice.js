import { PLAN, PLAN_PRICE_GHS } from "./plans";
import { extractCountryFromHeaders } from "./geo";

// The yearly plan's price as an artist in each African country sees it.
// Display only: the Paystack account is Ghana-registered, so every payment
// is still charged in cedis (PLAN_PRICE_GHS) and the artist's bank converts
// it. Outside Ghana the amounts below are round approximations of $49 at
// mid-2026 rates, which is why the UI says "about". Revisit them if a
// currency moves a lot.
//
// Countries that use the US dollar (Liberia, Zimbabwe) and everyone outside
// Africa just see $49.
const XOF = { currency: "XOF", symbol: "CFA ", amount: 28000 };
const XAF = { currency: "XAF", symbol: "FCFA ", amount: 28000 };

export const LOCAL_PRICES = {
  GH: { currency: "GHS", symbol: "GH₵", amount: PLAN_PRICE_GHS },
  NG: { currency: "NGN", symbol: "₦", amount: 75000 },
  KE: { currency: "KES", symbol: "KSh ", amount: 6300 },
  ZA: { currency: "ZAR", symbol: "R", amount: 850 },
  NA: { currency: "NAD", symbol: "N$", amount: 850 },
  BW: { currency: "BWP", symbol: "P", amount: 650 },
  UG: { currency: "UGX", symbol: "USh ", amount: 180000 },
  TZ: { currency: "TZS", symbol: "TSh ", amount: 125000 },
  RW: { currency: "RWF", symbol: "RF ", amount: 70000 },
  ET: { currency: "ETB", symbol: "Br ", amount: 7000 },
  ZM: { currency: "ZMW", symbol: "K", amount: 1200 },
  MW: { currency: "MWK", symbol: "MK", amount: 85000 },
  MZ: { currency: "MZN", symbol: "MT ", amount: 3100 },
  AO: { currency: "AOA", symbol: "Kz ", amount: 45000 },
  GM: { currency: "GMD", symbol: "D", amount: 3500 },
  SL: { currency: "SLE", symbol: "Le ", amount: 1100 },
  EG: { currency: "EGP", symbol: "E£", amount: 2400 },
  MA: { currency: "MAD", symbol: "MAD ", amount: 450 },
  DZ: { currency: "DZD", symbol: "DA ", amount: 6500 },
  TN: { currency: "TND", symbol: "DT ", amount: 150 },
  // West African CFA franc (UEMOA)
  CI: XOF, SN: XOF, BJ: XOF, TG: XOF, ML: XOF, BF: XOF, NE: XOF, GW: XOF,
  // Central African CFA franc (CEMAC)
  CM: XAF, GA: XAF, CG: XAF, TD: XAF, CF: XAF, GQ: XAF,
};

const USD_PRICE = { currency: "USD", symbol: "$", amount: PLAN.priceUsd };

function formatAmount(symbol, amount) {
  return symbol + amount.toLocaleString("en-US");
}

// Everything the pricing and billing UI needs for one visitor. Plain JSON so
// it can go straight into getServerSideProps.
export function getLocalPrice(countryCode) {
  const code = (countryCode || "").toUpperCase();
  const entry = LOCAL_PRICES[code] || USD_PRICE;
  return {
    country: code || null,
    currency: entry.currency,
    label: formatAmount(entry.symbol, entry.amount),
    // Only the cedi price is exact; every other local figure is converted
    // by the artist's bank at payment time.
    approximate: entry.currency !== "GHS" && entry.currency !== "USD",
    chargedLabel: "GH₵" + PLAN_PRICE_GHS.toLocaleString("en-US"),
    usdLabel: "$" + PLAN.priceUsd,
  };
}

// Country for pricing: a ?country=XX override (display only, handy for
// checking each country on a preview), else the visitor's IP country.
export function pricingCountryFromRequest(req, query) {
  const override = query && typeof query.country === "string" ? query.country.trim().toUpperCase() : "";
  if (/^[A-Z]{2}$/.test(override)) return override;
  const fromIp = extractCountryFromHeaders(req.headers);
  return fromIp === "UNKNOWN" ? null : fromIp;
}
