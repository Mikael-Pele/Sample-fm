// Lightweight, dependency-free inline SVG logo marks for each supported
// platform. Kept intentionally small/flat to preserve the sub-200KB page
// weight budget for fans on constrained mobile data plans.

export function AudiomackIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className={className} fill="none">
      <circle cx="12" cy="12" r="11" fill="#FFA200" />
      <path
        d="M7 15.5V8.5l3.2 3.4L13.4 8.5v7M17 8.5v7"
        stroke="#0B0B0F"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BoomplayIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className={className} fill="none">
      <circle cx="12" cy="12" r="11" fill="#F3D93A" />
      <path d="M9.5 7.5L16 12l-6.5 4.5v-9z" fill="#0B0B0F" />
    </svg>
  );
}

export function SpotifyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className={className} fill="none">
      <circle cx="12" cy="12" r="11" fill="#1DB954" />
      <path
        d="M6.5 9.8c3.3-1 7.7-.6 10.4 1.1M7 13c2.8-.8 6.3-.5 8.6.9M7.4 16c2.3-.6 5-.4 6.9.8"
        stroke="#0B0B0F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppleMusicIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className={className} fill="none">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#FA243C" />
      <path
        d="M15.8 6.2v7.4a2.3 2.3 0 11-1.4-2.1V8.6l-4.8 1.1v6a2.3 2.3 0 11-1.4-2.1V7.6l7.6-1.4z"
        fill="#fff"
      />
    </svg>
  );
}

export function YouTubeMusicIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className={className} fill="none">
      <circle cx="12" cy="12" r="11" fill="#FF0000" />
      <circle cx="12" cy="12" r="6.2" fill="#fff" />
      <circle cx="12" cy="12" r="1.9" fill="#FF0000" />
      <path d="M10.6 9.8l3.4 2.2-3.4 2.2V9.8z" fill="#FF0000" />
    </svg>
  );
}

export function SampleFmMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" className={className} fill="none">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#7C5CFC" />
      <path d="M7 16V8l5 4 5-4v8" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
