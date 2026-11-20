import {
  ArrowLeft,
  BellPlus,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  PlaneTakeoff,
} from 'lucide-react';
import {
  addDaysISO,
  formatDisplayDate,
  formatDuration,
  formatINR,
  getTodayISODate,
  RouteFareAnalysis,
} from '../utils/fareLogic';
import { FareChart } from './FareChart';

interface DashboardViewProps {
  analysis: RouteFareAnalysis;
  isLoading: boolean;
  isDemoMode: boolean;
  onChangeDate: (newDate: string) => void;
  onEditSearch: () => void;
  onSetAlert: (analysis: RouteFareAnalysis) => void;
}

export function DashboardView({
  analysis,
  isLoading,
  isDemoMode,
  onChangeDate,
  onEditSearch,
  onSetAlert,
}: DashboardViewProps) {
  const todayISO = getTodayISODate();
  const maxDateISO = addDaysISO(todayISO, 120);

  if (isLoading) {
    return (
      <main
        className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-7 space-y-6"
        aria-busy="true"
        aria-label="Loading route fare analysis"
      >
        <div className="h-14 rounded-xl bg-zinc-200/80 animate-pulse" />
        <div className="h-44 rounded-xl bg-white border border-zinc-200 p-6 space-y-4">
          <div className="h-5 w-36 bg-zinc-200 rounded animate-pulse" />
          <div className="h-10 w-56 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-zinc-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="h-24 rounded-xl bg-white border border-zinc-200 p-5 space-y-3">
              <div className="h-3.5 w-24 bg-zinc-200 rounded animate-pulse" />
              <div className="h-7 w-28 bg-zinc-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-80 rounded-xl bg-white border border-zinc-200 p-6">
          <div className="h-5 w-48 bg-zinc-200 rounded animate-pulse mb-4" />
          <div className="h-60 w-full bg-zinc-100 rounded animate-pulse" />
        </div>
      </main>
    );
  }

  const verdictStyle =
    analysis.verdict.type === 'BOOK_NOW'
      ? {
          cardBorder: 'border-emerald-200',
          badgeBg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          accentText: 'text-emerald-800',
          Icon: CheckCircle2,
        }
      : analysis.verdict.type === 'WATCH'
        ? {
            cardBorder: 'border-amber-200',
            badgeBg: 'bg-amber-50 border-amber-300 text-amber-900',
            accentText: 'text-amber-800',
            Icon: Eye,
          }
        : {
            cardBorder: 'border-red-200',
            badgeBg: 'bg-red-50 border-red-300 text-red-900',
            accentText: 'text-red-800',
            Icon: Clock,
          };

  const VerdictIcon = verdictStyle.Icon;

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-7 space-y-6">
      {/* Contextual route subheader */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-1">
            <span className="font-semibold text-amber-900">SAMPLE DATA</span>
            <span aria-hidden="true">·</span>
            <span>Simulated fares for demonstration</span>
            {isDemoMode && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-emerald-800">Demo Mode active</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <span className="font-mono whitespace-nowrap">
              {analysis.origin.code} → {analysis.destination.code}
            </span>
            <span className="text-zinc-300 font-normal text-lg" aria-hidden="true">·</span>
            <span className="text-zinc-700 font-semibold text-base sm:text-xl tracking-normal">
              {analysis.origin.city} to {analysis.destination.city}
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Travel date: <strong className="font-semibold text-zinc-900">{formatDisplayDate(analysis.chosenDate)}</strong>
            <span className="mx-2 text-zinc-400" aria-hidden="true">·</span>
            <span className="tabular-nums">
              {analysis.daysUntilTravel === 0
                ? 'Departing today'
                : analysis.daysUntilTravel > 0
                  ? `${analysis.daysUntilTravel} days from today`
                  : `${Math.abs(analysis.daysUntilTravel)} days ago`}
            </span>
          </p>
        </div>

        {/* Inline route controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label htmlFor="dashboard-date-picker" className="sr-only">
              Change travel date
            </label>
            <input
              id="dashboard-date-picker"
              type="date"
              value={analysis.chosenDate}
              min={todayISO}
              max={maxDateISO}
              onChange={(e) => {
                if (e.target.value) onChangeDate(e.target.value);
              }}
              className="h-10 px-3 rounded-lg border border-zinc-300 bg-white text-xs sm:text-sm font-medium text-zinc-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
            />
          </div>

          <button
            type="button"
            onClick={onEditSearch}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs sm:text-sm font-medium text-zinc-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Change route</span>
          </button>

          <button
            type="button"
            onClick={() => onSetAlert(analysis)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] active:bg-[#CA8A04] text-zinc-950 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BellPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Set Fare Alert</span>
          </button>
        </div>
      </section>

      {/* Dominant Focal Anchor: Verdict Hero Card */}
      <section
        aria-label="Booking verdict summary"
        className={`bg-white border ${verdictStyle.cardBorder} rounded-xl p-6 sm:p-7`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Verdict + Plain-English comparison */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span
                data-testid="verdict-label"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-extrabold tracking-wide ${verdictStyle.badgeBg}`}
              >
                <VerdictIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{analysis.verdict.label}</span>
              </span>
              <span className={`text-sm font-semibold ${verdictStyle.accentText}`}>
                {analysis.verdict.shortAdvice}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500">Today’s lowest fare</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                <p
                  data-testid="today-lowest-fare"
                  className="text-4xl sm:text-[44px] font-extrabold font-mono tabular-nums tracking-tight text-zinc-950 leading-none"
                >
                  {formatINR(analysis.todayLowestFare)}
                </p>
                <p className="text-sm text-zinc-600">
                  on <strong className="font-semibold text-zinc-900">{analysis.chosenDayAirlines[0].airline}</strong>{' '}
                  <span className="font-mono text-xs text-zinc-500">({analysis.chosenDayAirlines[0].flightNumber})</span>
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base font-medium text-zinc-900 leading-snug">
              {analysis.comparisonSentence}
            </p>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-2xl">
              {analysis.verdict.explanation}
            </p>
          </div>

          {/* Right: Fare Index 0-100 visual meter */}
          <div className="lg:col-span-5 lg:border-l lg:border-zinc-200 lg:pl-7 space-y-4">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-zinc-700">FareSense Index</p>
                <p className="text-xs text-zinc-500">Lower score means better value</p>
              </div>
              <p
                data-testid="fare-index-score"
                className="text-2xl font-extrabold font-mono tabular-nums text-zinc-950"
              >
                {analysis.fareIndex}
                <span className="text-sm font-medium text-zinc-400"> / 100</span>
              </p>
            </div>

            {/* 3-zone segmented scale with exact marker */}
            <div>
              <div className="relative h-3 w-full rounded-full overflow-hidden flex bg-zinc-100">
                <div className="w-[35%] bg-emerald-500/85" title="0-34: BOOK NOW" />
                <div className="w-[31%] bg-amber-400/90" title="35-65: WATCH" />
                <div className="w-[34%] bg-red-500/85" title="66-100: WAIT" />
              </div>
              <div className="relative h-4 mt-1">
                <div
                  style={{ left: `${analysis.fareIndex}%` }}
                  className="absolute -translate-x-1/2 -top-4.5 flex flex-col items-center"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-zinc-950 border-2 border-white shadow-sm" />
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 pt-0.5">
                  <span className="text-emerald-800">0–34 Book Now</span>
                  <span className="text-amber-800">35–65 Watch</span>
                  <span className="text-red-800">66–100 Wait</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-zinc-100 text-xs text-zinc-600">
              <span>Want a lower fare?</span>
              <button
                type="button"
                onClick={() => onSetAlert(analysis)}
                className="font-semibold text-zinc-950 underline decoration-[#EAB308] decoration-2 underline-offset-4 hover:text-[#A16207] transition-colors cursor-pointer whitespace-nowrap"
              >
                Pre-fill Fare Alert →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Stat Strip (single elevation with hairline dividers) */}
      <section
        aria-label="30-day fare benchmarks"
        className="bg-white border border-zinc-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-zinc-200 overflow-hidden"
      >
        <div className="p-5">
          <p className="text-xs font-medium text-zinc-500">30-Day Median</p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-zinc-950">
            {formatINR(analysis.median30d)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Primary benchmark</p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-zinc-500">30-Day Lowest</p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-800">
            {formatINR(analysis.min30d)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Best recent trough</p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-zinc-500">30-Day Highest</p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-zinc-950">
            {formatINR(analysis.max30d)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Peak recent day</p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-zinc-500">Fair Price Band (±10%)</p>
          <p className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-950">
            {formatINR(analysis.fairRangeLow)}–{formatINR(analysis.fairRangeHigh)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Shaded band on chart</p>
        </div>
      </section>

      {/* Interactive SVG Chart Card */}
      <section
        aria-label="Historical and upcoming fare trend"
        className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-7"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-5">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">
              Fare History &amp; Outlook
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Last 30 days + next 7 days relative to {formatDisplayDate(analysis.chosenDate)} · Hover to inspect or click any day to switch travel date
            </p>
          </div>
          <span className="text-xs font-medium text-amber-900 shrink-0">
            SAMPLE DATA
          </span>
        </div>

        <FareChart
          points={analysis.chartPoints}
          median30d={analysis.median30d}
          fairRangeLow={analysis.fairRangeLow}
          fairRangeHigh={analysis.fairRangeHigh}
          verdictType={analysis.verdict.type}
          onSelectDate={onChangeDate}
        />
      </section>

      {/* 3-Airline Comparison Table */}
      <section
        aria-label="Airline fare comparison"
        className="bg-white border border-zinc-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 sm:px-7 py-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">
              Airlines on {formatDisplayDate(analysis.chosenDate)}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              3 non-stop sample options for {analysis.origin.code} → {analysis.destination.code} sorted by lowest fare
            </p>
          </div>
          <span className="text-xs font-medium text-amber-900">SAMPLE DATA</span>
        </div>

        {/* Mobile stacked airline rows so Fare (INR) is always immediately visible */}
        <ul className="md:hidden divide-y divide-zinc-200">
          {analysis.chosenDayAirlines.map((opt) => (
            <li
              key={`mobile-${opt.id}`}
              className={`p-4 space-y-2.5 ${opt.isLowest ? 'bg-amber-50/35' : 'bg-white'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 font-mono text-xs font-bold text-zinc-800 flex items-center justify-center shrink-0">
                    {opt.iata}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-zinc-950 truncate">{opt.airline}</p>
                    <p className="text-xs font-mono text-zinc-500">
                      {opt.flightNumber}
                      {opt.isLowest && (
                        <span className="ml-2 font-sans font-semibold text-emerald-800">
                          Lowest fare
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold font-mono tabular-nums text-zinc-950">
                    {formatINR(opt.fare)}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {opt.isLowest ? 'Baseline fare' : `+${formatINR(opt.fare - analysis.todayLowestFare)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-zinc-600 pt-1 border-t border-zinc-100">
                <span className="font-mono font-semibold text-zinc-900 tabular-nums">
                  {opt.departureTime} → {opt.arrivalTime}
                </span>
                <span>
                  {formatDuration(opt.durationMinutes)} · {opt.stops}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* Desktop high-density comparison table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-semibold text-zinc-600">
                <th scope="col" className="py-3.5 pl-5 sm:pl-7 pr-4">Airline</th>
                <th scope="col" className="py-3.5 px-4">Flight</th>
                <th scope="col" className="py-3.5 px-4">Schedule</th>
                <th scope="col" className="py-3.5 px-4">Duration &amp; Baggage</th>
                <th scope="col" className="py-3.5 pl-4 pr-5 sm:pr-7 text-right">Fare (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {analysis.chosenDayAirlines.map((opt) => (
                <tr
                  key={opt.id}
                  className={`transition-colors ${
                    opt.isLowest ? 'bg-amber-50/35 hover:bg-amber-50/60' : 'hover:bg-zinc-50'
                  }`}
                >
                  <td className="py-4 pl-5 sm:pl-7 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 font-mono text-xs font-bold text-zinc-800 flex items-center justify-center shrink-0">
                        {opt.iata}
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-950">{opt.airline}</p>
                        {opt.isLowest && (
                          <p className="text-xs font-semibold text-emerald-800">
                            Lowest fare
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs font-medium text-zinc-700 whitespace-nowrap">
                    {opt.flightNumber}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-mono text-sm font-semibold tabular-nums text-zinc-950 flex items-center gap-1.5">
                      <span>{opt.departureTime}</span>
                      <PlaneTakeoff className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                      <span>{opt.arrivalTime}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {analysis.origin.code} → {analysis.destination.code}
                    </p>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-zinc-800">
                      {formatDuration(opt.durationMinutes)} · {opt.stops}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{opt.cabinBaggage}</p>
                  </td>
                  <td className="py-4 pl-4 pr-5 sm:pr-7 text-right whitespace-nowrap">
                    <p className="text-base font-extrabold font-mono tabular-nums text-zinc-950">
                      {formatINR(opt.fare)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {opt.isLowest
                        ? 'Baseline fare'
                        : `+${formatINR(opt.fare - analysis.todayLowestFare)} more`}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Honest Methodology & Dynamic Pricing Disclaimer */}
      <section
        aria-label="Methodology and pricing disclaimer"
        className="bg-white border border-zinc-200 rounded-xl p-5 flex items-start gap-3 text-xs sm:text-sm text-zinc-600 leading-relaxed"
      >
        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-zinc-900">About FareSense &amp; dynamic pricing:</strong>{' '}
          Real-world airline ticket prices fluctuate dynamically based on remaining seat buckets, holiday demand, fuel surcharges, and booking window. The FareSense Index is a decision aid built from the 30-day median benchmark—not a price guarantee. All figures shown here are deterministic <strong className="font-semibold text-zinc-800">SAMPLE DATA</strong> created for demonstration.
        </p>
      </section>
    </main>
  );
}
