// Lightweight, dependency-free inline SVG logo marks for each supported
// platform. Kept intentionally small/flat to preserve the sub-200KB page
// weight budget for fans on constrained mobile data plans. Every icon
// renders inside a 24x24 flex bounding box and carries the platform's
// exact official brand color for instant recognition/trust.

export function AudiomackIcon({ className }) {
  return (
    <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${className || ""}`}>
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#FF8200" />
        <path
          d="M7 15.5V8.5l3.2 3.4L13.4 8.5v7M17 8.5v7"
          stroke="#0A0A0C"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function BoomplayIcon({ className }) {
  return (
    <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${className || ""}`}>
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#FFC107" />
        <path d="M9.5 7.5L16 12l-6.5 4.5v-9z" fill="#0A0A0C" />
      </svg>
    </div>
  );
}

export function SpotifyIcon({ className }) {
  return (
    <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${className || ""}`}>
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#1DB954" />
        <path
          d="M6.5 9.8c3.3-1 7.7-.6 10.4 1.1M7 13c2.8-.8 6.3-.5 8.6.9M7.4 16c2.3-.6 5-.4 6.9.8"
          stroke="#0A0A0C"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function AppleMusicIcon({ className }) {
  return (
    <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${className || ""}`}>
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="6" fill="#FA243C" />
        <path
          d="M15.8 6.2v7.4a2.3 2.3 0 11-1.4-2.1V8.6l-4.8 1.1v6a2.3 2.3 0 11-1.4-2.1V7.6l7.6-1.4z"
          fill="#fff"
        />
      </svg>
    </div>
  );
}

export function YouTubeMusicIcon({ className }) {
  return (
    <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${className || ""}`}>
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#FF0000" />
        <circle cx="12" cy="12" r="6.2" fill="#fff" />
        <circle cx="12" cy="12" r="1.9" fill="#FF0000" />
        <path d="M10.6 9.8l3.4 2.2-3.4 2.2V9.8z" fill="#FF0000" />
      </svg>
    </div>
  );
}

export function SampleFmMark({ className }) {
  return (
    <div className={`w-4 h-4 flex items-center justify-center shrink-0 ${className || ""}`}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="6" fill="#D4AF37" />
        <path
          d="M7 16V8l5 4 5-4v8"
          stroke="#0A0A0C"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function UploadIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className={className} fill="none">
      <path
        d="M12 16V4m0 0L7 9m5-5l5 5M5 16v3a2 2 0 002 2h10a2 2 0 002-2v-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" className={className} fill="none">
      <path
        d="M6 10V8a6 6 0 1112 0v2M5 10h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
