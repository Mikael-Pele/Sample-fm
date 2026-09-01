// Lightweight, dependency-free inline SVG logo marks for each supported
// platform. Kept intentionally small/flat to preserve the sub-200KB page
// weight budget for fans on constrained mobile data plans. Every icon
// accepts a `size` prop (defaults to 24px) so callers can render them
// large and prominent — e.g. the Dashboard's platform rows use size=44 —
// without any layout/specificity fights with wrapper classes.

export function AudiomackIcon({ className, size = 24 }) {
  // Reproduces Audiomack's actual mark: an orange soundwave squiggle on a
  // black rounded field (their real logo is not a circle+play-triangle).
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className || ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <rect x="0.5" y="0.5" width="23" height="23" rx="6" fill="#000000" />
        <path
          d="M3.5 13.5L6.8 7l3 10 3.2-13.5 3 13 3-9.5 1.5 6"
          stroke="#FF8200"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export function BoomplayIcon({ className, size = 24 }) {
  // Reproduces Boomplay's actual mark: a cyan ribbon-style "B" on a black
  // circle (their real brand color is cyan/turquoise, not yellow).
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className || ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <circle cx="12" cy="12" r="11.5" fill="#000000" />
        <rect x="7" y="5.5" width="2.1" height="13" rx="1" fill="#00E5D4" />
        <path d="M8.2 5.5L16 8.6L8.2 11.8V5.5z" fill="#00E5D4" />
        <path d="M8.2 12.2L16 15.3L8.2 18.5V12.2z" fill="#00E5D4" />
      </svg>
    </div>
  );
}

export function SpotifyIcon({ className, size = 24 }) {
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className || ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
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

export function AppleMusicIcon({ className, size = 24 }) {
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className || ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <rect x="1" y="1" width="22" height="22" rx="6" fill="#FA243C" />
        <path
          d="M15.8 6.2v7.4a2.3 2.3 0 11-1.4-2.1V8.6l-4.8 1.1v6a2.3 2.3 0 11-1.4-2.1V7.6l7.6-1.4z"
          fill="#fff"
        />
      </svg>
    </div>
  );
}

export function YouTubeMusicIcon({ className, size = 24 }) {
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className || ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <circle cx="12" cy="12" r="11" fill="#FF0000" />
        <circle cx="12" cy="12" r="6.2" fill="#fff" />
        <circle cx="12" cy="12" r="1.9" fill="#FF0000" />
        <path d="M10.6 9.8l3.4 2.2-3.4 2.2V9.8z" fill="#FF0000" />
      </svg>
    </div>
  );
}

export function SampleFmMark({ className, size = 16 }) {
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className || ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <rect x="1" y="1" width="22" height="22" rx="6" fill="#FF4D00" />
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
