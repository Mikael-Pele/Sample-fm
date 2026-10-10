import { useEffect, useRef, useState } from "react";

// Clicks-over-time area chart for the Dashboard's Analytics Panel. Plain
// SVG, no chart library: one series, so no legend — the card title names
// it. Hovering (or dragging a finger across) the plot shows a crosshair
// and a tooltip for the nearest day.

const HEIGHT = 180;
const PAD = { top: 12, right: 8, bottom: 24, left: 32 };
const LINE_COLOR = "#FF4D00"; // brand.DEFAULT

function formatDay(isoDate, withYear = false) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

// Rounds the y-axis ceiling up to a readable number (1, 2, 2.5, 4, 5, 6 or 8 × 10^n).
function niceMax(value) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 4, 5, 6, 8, 10].find((m) => m * magnitude >= value);
  return step * magnitude;
}

export default function ClicksChart({ daily }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    if (!wrapRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, []);

  const points = daily || [];
  const yMax = niceMax(Math.max(0, ...points.map((p) => p.count)));
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const baseline = PAD.top + plotH;

  const x = (i) => PAD.left + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v) => PAD.top + plotH - (v / yMax) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.count)}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L${x(points.length - 1)},${baseline} L${x(0)},${baseline} Z`
    : "";

  const xLabelIndexes = points.length
    ? [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]
    : [];

  function handlePointer(e) {
    if (!points.length || plotW <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left - PAD.left) / plotW;
    const i = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, i)));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div ref={wrapRef} className="relative w-full select-none" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label="Daily SmartLink clicks"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setHoverIndex(null)}
          className="block touch-pan-y"
        >
          <defs>
            <linearGradient id="clicksAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LINE_COLOR} stopOpacity="0.22" />
              <stop offset="100%" stopColor={LINE_COLOR} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Recessive grid: baseline, midpoint and ceiling */}
          {[0, yMax / 2, yMax].map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={PAD.left + plotW}
                y1={y(v)}
                y2={y(v)}
                className="stroke-base-border"
                strokeDasharray={v === 0 ? undefined : "3 4"}
              />
              <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize="10" className="fill-base-muted">
                {Number.isInteger(v) ? v : v.toFixed(1)}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="url(#clicksAreaFill)" />
          <path
            d={linePath}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {xLabelIndexes.map((i, n) => (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 6}
              fontSize="10"
              className="fill-base-muted"
              textAnchor={n === 0 ? "start" : n === xLabelIndexes.length - 1 ? "end" : "middle"}
            >
              {formatDay(points[i].date)}
            </text>
          ))}

          {hovered && (
            <g pointerEvents="none">
              <line
                x1={x(hoverIndex)}
                x2={x(hoverIndex)}
                y1={PAD.top}
                y2={baseline}
                className="stroke-base-muted"
                strokeWidth="1"
              />
              <circle
                cx={x(hoverIndex)}
                cy={y(hovered.count)}
                r="4.5"
                fill={LINE_COLOR}
                className="stroke-base-card"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      )}

      {hovered && (
        <div
          className="absolute top-0 pointer-events-none bg-base-bg border border-base-border rounded-lg px-2.5 py-1.5 text-xs shadow-glass whitespace-nowrap"
          style={{
            left: Math.min(Math.max(x(hoverIndex), 60), width - 60),
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-base-muted">{formatDay(hovered.date, true)}</div>
          <div className="font-semibold text-fg">
            {hovered.count} click{hovered.count === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {/* Same numbers as a table for screen readers */}
      <table className="sr-only">
        <caption>Daily SmartLink clicks</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Clicks</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{formatDay(p.date, true)}</td>
              <td>{p.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
