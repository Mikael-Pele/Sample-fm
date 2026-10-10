// Client-safe EPK constants (no server imports), used by the editor too.
// Every section the artist can show or hide on their public EPK, in page
// order. `verified` sections are counted by Droppa; the rest are typed in by
// the artist and labelled self-reported.
export const EPK_SECTIONS = [
  { key: "photo", label: "Photo" },
  { key: "bio", label: "Bio" },
  { key: "clicks", label: "Total SmartLink clicks", verified: true },
  { key: "releases", label: "Release count", verified: true },
  { key: "platforms", label: "Platforms linked", verified: true },
  { key: "monthly_streams", label: "Monthly streams" },
  { key: "press_quotes", label: "Press quotes" },
  { key: "booking", label: "Booking contact" },
];

export const MAX_PRESS_QUOTES = 6;
