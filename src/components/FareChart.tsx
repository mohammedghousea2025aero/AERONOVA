import { useMemo, useState } from 'react';
import {
  DailyFarePoint,
  formatDisplayDate,
  formatINR,
  formatShortDate,
  VerdictType,
} from '../utils/fareLogic';

interface FareChartProps {
  points: DailyFarePoint[];
  median30d: number;
  fairRangeLow: number;
  fairRangeHigh: number;
  verdictType: VerdictType;
  onSelectDate?: (isoDate: string) => void;
}

const CHART_WIDTH = 880;
const CHART_HEIGHT = 320;
const PAD_LEFT = 72;
const PAD_RIGHT = 28;
const PAD_TOP = 24;
const PAD_BOTTOM = 44;

const PLOT_W = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

export function FareChart({
  points,
  median30d,
  fairRangeLow,
  fairRangeHigh,
  verdictType,
  onSelectDate,
}: FareChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chosenIndex = useMemo(
    () => points.findIndex((p) => p.isChosenDate),
    [points],
  );

  // Compute clean Y-axis scale spanning all points and the ±10% fair range band
  const { yMin, yMax, yTicks } = useMemo(() => {
    const allFares = points.map((p) => p.lowestFare);
    const rawMin = Math.min(...allFares, fairRangeLow);
    const rawMax = Math.max(...allFares, fairRangeHigh);
    const span = Math.max(800, rawMax - rawMin);
    const step = span > 4500 ? 1500 : span > 2200 ? 1000 : 500;

    const minBound = Math.max(0, Math.floor((rawMin - span * 0.14) / step) * step);
    const maxBound = Math.ceil((rawMax + span * 0.14) / step) * step;

    const ticks: number[] = [];
    const tickCount = 4;
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(Math.round((minBound + ((maxBound - minBound) * i) / tickCount) / 10) * 10);
    }

    return { yMin: minBound, yMax: maxBound, yTicks: ticks };
  }, [points, fairRangeLow, fairRangeHigh]);

  const xForIndex = (idx: number) => {
    if (points.length <= 1) return PAD_LEFT;
    return PAD_LEFT + (idx / (points.length - 1)) * PLOT_W;
  };

  const yForFare = (fare: number) => {
    const ratio = (fare - yMin) / Math.max(1, yMax - yMin);
    return PAD_TOP + PLOT_H - ratio * PLOT_H;
  };

  // Build SVG path segments: solid historical up to chosenDate, dashed forward +7d
  const { historyPath, forwardPath } = useMemo(() => {
    if (points.length === 0) return { historyPath: '', forwardPath: '' };
    const splitIdx = chosenIndex >= 0 ? chosenIndex : points.length - 1;

    const histCmds = points
      .slice(0, splitIdx + 1)
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xForIndex(i).toFixed(1)} ${yForFare(pt.lowestFare).toFixed(1)}`);

    const fwdCmds = points
      .slice(splitIdx)
      .map(
        (pt, i) =>
          `${i === 0 ? 'M' : 'L'} ${xForIndex(splitIdx + i).toFixed(1)} ${yForFare(pt.lowestFare).toFixed(1)}`,
      );

    return {
      historyPath: histCmds.join(' '),
      forwardPath: fwdCmds.join(' '),
    };
  }, [points, chosenIndex, yMin, yMax]);

  const medianY = yForFare(median30d);
  const fairTopY = yForFare(fairRangeHigh);
  const fairBottomY = yForFare(fairRangeLow);
  const chosenPoint = chosenIndex >= 0 ? points[chosenIndex] : null;
  const chosenX = chosenIndex >= 0 ? xForIndex(chosenIndex) : PAD_LEFT;
  const chosenY = chosenPoint ? yForFare(chosenPoint.lowestFare) : PAD_TOP;

  const verdictDotColor =
    verdictType === 'BOOK_NOW'
      ? '#15803D'
      : verdictType === 'WATCH'
        ? '#D97706'
        : '#DC2626';

  const verdictRingColor =
    verdictType === 'BOOK_NOW'
      ? '#BBF7D0'
      : verdictType === 'WATCH'
        ? '#FDE68A'
        : '#FECACA';

  // X-axis tick indices: start (-30d), evenly spaced ticks, chosenDate (30), end (+7d)
  const xTickIndices = [0, 7, 15, 22, 30, 37].filter((idx) => idx < points.length);

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;
  const activeX = hoveredIdx !== null ? xForIndex(hoveredIdx) : 0;
  const activeY = activePoint ? yForFare(activePoint.lowestFare) : 0;

  const activeDeviationPct =
    activePoint && median30d > 0
      ? Math.round(((activePoint.lowestFare - median30d) / median30d) * 100)
      : 0;

  // Position tooltip in percentage coordinates relative to SVG viewBox
  const tooltipLeftPct = hoveredIdx !== null ? (activeX / CHART_WIDTH) * 100 : 50;
  const alignTooltipRight = tooltipLeftPct > 64;

  return (
    <div className="w-full">
      {/* Legend row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-600 mb-4">
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-0.5 bg-zinc-900 inline-block" aria-hidden="true" />
          <span>Past 30 days</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="w-4 h-0.5 border-t-2 border-dashed border-zinc-500 inline-block"
            aria-hidden="true"
          />
          <span>Next 7 days</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="w-3.5 h-3 bg-[#FEF3C7] border border-[#F59E0B]/40 rounded-xs inline-block"
            aria-hidden="true"
          />
          <span className="tabular-nums">
            Fair range ({formatINR(fairRangeLow)} – {formatINR(fairRangeHigh)})
          </span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: verdictDotColor }}
            aria-hidden="true"
          />
          <span>Chosen travel date</span>
        </span>
      </div>

      {/* Responsive SVG wrapper (preserves legible text on narrow mobile screens) */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="relative min-w-[560px] md:min-w-0 w-full" data-testid="fare-chart-container">
          <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label={`Line chart of daily lowest flight fares from ${formatShortDate(points[0]?.date ?? '')} to ${formatShortDate(points[points.length - 1]?.date ?? '')}, showing 30-day median ${formatINR(median30d)} and chosen travel date fare ${chosenPoint ? formatINR(chosenPoint.lowestFare) : ''}`}
          className="w-full h-auto block select-none overflow-visible"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Shaded Fair Range Band (Median ±10%) */}
          <rect
            x={PAD_LEFT}
            y={fairTopY}
            width={PLOT_W}
            height={Math.max(1, fairBottomY - fairTopY)}
            fill="#FEF3C7"
            fillOpacity={0.55}
          />
          <line
            x1={PAD_LEFT}
            y1={fairTopY}
            x2={PAD_LEFT + PLOT_W}
            y2={fairTopY}
            stroke="#F59E0B"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
          <line
            x1={PAD_LEFT}
            y1={fairBottomY}
            x2={PAD_LEFT + PLOT_W}
            y2={fairBottomY}
            stroke="#F59E0B"
            strokeOpacity={0.35}
            strokeWidth={1}
          />

          {/* Horizontal gridlines & Y-axis labels */}
          {yTicks.map((tick) => {
            const y = yForFare(tick);
            return (
              <g key={tick}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={PAD_LEFT + PLOT_W}
                  y2={y}
                  stroke="#E4E4E7"
                  strokeWidth={1}
                />
                <text
                  x={PAD_LEFT - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-zinc-500 text-[11px] font-mono"
                >
                  {formatINR(tick)}
                </text>
              </g>
            );
          })}

          {/* 30-Day Median dashed reference line + non-overlapping label badge */}
          <line
            x1={PAD_LEFT}
            y1={medianY}
            x2={PAD_LEFT + PLOT_W}
            y2={medianY}
            stroke="#B45309"
            strokeWidth={1.25}
            strokeDasharray="4 4"
          />
          <g transform={`translate(${PAD_LEFT + 8}, ${medianY - 19})`}>
            <rect
              x={0}
              y={0}
              width={132}
              height={16}
              rx={3}
              fill="#FFFBEB"
              fillOpacity={0.95}
              stroke="#FDE68A"
              strokeWidth={1}
            />
            <text
              x={6}
              y={11.5}
              textAnchor="start"
              className="fill-amber-900 text-[10px] font-mono font-semibold"
            >
              30d median {formatINR(median30d)}
            </text>
          </g>

          {/* Vertical guide on Chosen Travel Date */}
          {chosenPoint && (
            <line
              x1={chosenX}
              y1={PAD_TOP}
              x2={chosenX}
              y2={PAD_TOP + PLOT_H}
              stroke={verdictDotColor}
              strokeOpacity={0.35}
              strokeWidth={1.25}
              strokeDasharray="3 3"
            />
          )}

          {/* Forward outlook (+7d) line */}
          {forwardPath && (
            <path
              d={forwardPath}
              fill="none"
              stroke="#71717A"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Historical 30-day + chosen date line */}
          {historyPath && (
            <path
              d={historyPath}
              fill="none"
              stroke="#18181B"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Subtle dots along data points */}
          {points.map((pt, idx) => {
            if (pt.isChosenDate) return null;
            const cx = xForIndex(idx);
            const cy = yForFare(pt.lowestFare);
            const isHovered = hoveredIdx === idx;
            return (
              <circle
                key={pt.date}
                cx={cx}
                cy={cy}
                r={isHovered ? 5 : 2.2}
                fill={isHovered ? '#18181B' : pt.isForwardOutlook ? '#71717A' : '#3F3F46'}
                stroke={isHovered ? '#FACC15' : 'none'}
                strokeWidth={isHovered ? 2.5 : 0}
              />
            );
          })}

          {/* Hover vertical guide */}
          {hoveredIdx !== null && activePoint && (
            <line
              x1={activeX}
              y1={PAD_TOP}
              x2={activeX}
              y2={PAD_TOP + PLOT_H}
              stroke="#18181B"
              strokeOpacity={0.22}
              strokeWidth={1}
            />
          )}

          {/* Prominent Chosen Travel Date Marker */}
          {chosenPoint && (
            <g>
              <circle cx={chosenX} cy={chosenY} r={10} fill={verdictRingColor} />
              <circle
                cx={chosenX}
                cy={chosenY}
                r={5.5}
                fill={verdictDotColor}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            </g>
          )}

          {/* X-axis baseline and labels */}
          <line
            x1={PAD_LEFT}
            y1={PAD_TOP + PLOT_H}
            x2={PAD_LEFT + PLOT_W}
            y2={PAD_TOP + PLOT_H}
            stroke="#D4D4D8"
            strokeWidth={1}
          />
          {xTickIndices.map((idx) => {
            const pt = points[idx];
            const x = xForIndex(idx);
            const isChosen = pt.isChosenDate;
            return (
              <g key={pt.date}>
                <line
                  x1={x}
                  y1={PAD_TOP + PLOT_H}
                  x2={x}
                  y2={PAD_TOP + PLOT_H + 5}
                  stroke={isChosen ? verdictDotColor : '#A1A1AA'}
                  strokeWidth={isChosen ? 1.5 : 1}
                />
                <text
                  x={x}
                  y={PAD_TOP + PLOT_H + 19}
                  textAnchor={idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'}
                  className={
                    isChosen
                      ? 'fill-zinc-950 text-[11px] font-semibold'
                      : 'fill-zinc-500 text-[11px]'
                  }
                >
                  {formatShortDate(pt.date)}
                </text>
                {isChosen && (
                  <text
                    x={x}
                    y={PAD_TOP + PLOT_H + 33}
                    textAnchor="middle"
                    className="fill-zinc-700 text-[10px] font-semibold"
                  >
                    Travel date
                  </text>
                )}
              </g>
            );
          })}

          {/* Full-column accessible interactive hit zones for hover, focus, and click */}
          {points.map((pt, idx) => {
            const colWidth = PLOT_W / Math.max(1, points.length - 1);
            const x = xForIndex(idx) - colWidth / 2;
            return (
              <rect
                key={`hit-${pt.date}`}
                x={Math.max(PAD_LEFT, x)}
                y={PAD_TOP}
                width={colWidth}
                height={PLOT_H}
                fill="transparent"
                className="cursor-pointer focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label={`${formatDisplayDate(pt.date)}: lowest fare ${formatINR(pt.lowestFare)} on ${pt.cheapestAirline}${pt.isChosenDate ? ' (chosen travel date)' : ''}. Click to switch travel date.`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx((prev) => (prev === idx ? null : prev))}
                onClick={() => onSelectDate?.(pt.date)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectDate?.(pt.date);
                  }
                }}
              />
            );
          })}
        </svg>

        {/* Positioned floating hover tooltip */}
        {activePoint && hoveredIdx !== null && (
          <div
            role="tooltip"
            style={{
              left: `${Math.min(92, Math.max(8, tooltipLeftPct))}%`,
              top: `${Math.max(4, (activeY / CHART_HEIGHT) * 100 - 4)}%`,
            }}
            className={`pointer-events-none absolute z-20 -translate-y-full ${
              alignTooltipRight ? '-translate-x-full' : 'translate-x-2'
            } bg-zinc-950 text-white rounded-lg px-3 py-2.5 shadow-lg border border-zinc-800 w-52`}
          >
            <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-300">
              <span>{formatDisplayDate(activePoint.date)}</span>
              {activePoint.isChosenDate && (
                <span className="text-[#FACC15] font-semibold">Chosen</span>
              )}
              {activePoint.isForwardOutlook && (
                <span className="text-zinc-400">+{activePoint.offsetFromChosen}d</span>
              )}
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-base font-bold font-mono tabular-nums text-white">
                {formatINR(activePoint.lowestFare)}
              </span>
              <span
                className={`text-[11px] font-medium tabular-nums ${
                  activeDeviationPct < 0
                    ? 'text-emerald-400'
                    : activeDeviationPct > 0
                      ? 'text-red-400'
                      : 'text-zinc-300'
                }`}
              >
                {activeDeviationPct > 0 ? `+${activeDeviationPct}%` : `${activeDeviationPct}%`} vs median
              </span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              Lowest on {activePoint.cheapestAirline} · Click to inspect date
            </p>
          </div>
        )}
        </div>
      </div>
      <p className="md:hidden mt-2 text-[11px] text-zinc-500">
        Swipe chart left or right to inspect all 38 days.
      </p>
    </div>
  );
}
