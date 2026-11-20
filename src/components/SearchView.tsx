import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Calendar,
  Search,
  TrendingDown,
} from 'lucide-react';
import {
  AIRPORTS,
  AirportCode,
  addDaysISO,
  formatDisplayDate,
  formatDuration,
  getTodayISODate,
  POPULAR_ROUTES,
} from '../utils/fareLogic';

interface SearchViewProps {
  initialOrigin: AirportCode;
  initialDestination: AirportCode;
  initialDate: string;
  onSearchSubmit: (origin: AirportCode, destination: AirportCode, travelDate: string) => void;
  onSelectPopularRoute: (origin: AirportCode, destination: AirportCode, travelDate: string) => void;
  onLaunchDemo: () => void;
}

export function SearchView({
  initialOrigin,
  initialDestination,
  initialDate,
  onSearchSubmit,
  onSelectPopularRoute,
  onLaunchDemo,
}: SearchViewProps) {
  const [origin, setOrigin] = useState<AirportCode>(initialOrigin);
  const [destination, setDestination] = useState<AirportCode>(initialDestination);
  const [travelDate, setTravelDate] = useState<string>(initialDate);
  const [error, setError] = useState<string | null>(null);

  const todayISO = getTodayISODate();
  const maxDateISO = addDaysISO(todayISO, 120);

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin === destination) {
      setError('Origin and destination airports cannot be the same. Pick two different cities or swap them.');
      return;
    }
    if (!travelDate) {
      setError('Please choose a travel date to check historical and upcoming fares.');
      return;
    }
    setError(null);
    onSearchSubmit(origin, destination, travelDate);
  };

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero introduction */}
      <section className="max-w-3xl mb-8">
        <p className="text-xs font-medium text-zinc-500 mb-2">
          SAMPLE DATA <span aria-hidden="true">·</span> Domestic India Fare Intelligence <span aria-hidden="true">·</span> 7 Major Hubs
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-zinc-950 leading-[1.12] [text-wrap:balance]">
          Know whether to book now, watch, or wait before buying your flight.
        </h1>
        <p className="mt-3.5 text-base text-zinc-600 leading-relaxed max-w-2xl">
          FareSense compares today’s lowest available fare against the route’s past 30-day median and gives you a plain-English booking verdict in Indian Rupees.
        </p>
      </section>

      {/* Primary Search Card */}
      <section
        aria-label="Flight route search"
        className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-8"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Origin */}
            <div className="md:col-span-4">
              <label
                htmlFor="search-origin"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                From (Origin)
              </label>
              <select
                id="search-origin"
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value as AirportCode);
                  setError(null);
                }}
                className="w-full h-12 px-3.5 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#EAB308] focus:border-[#CA8A04] transition-colors"
              >
                {AIRPORTS.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.code} — {airport.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex md:justify-center">
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap origin and destination"
                title="Swap origin and destination"
                className="w-full md:w-11 h-11 md:h-12 rounded-lg border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA8A04]"
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="md:hidden text-xs font-medium">Swap airports</span>
              </button>
            </div>

            {/* Destination */}
            <div className="md:col-span-4">
              <label
                htmlFor="search-destination"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                To (Destination)
              </label>
              <select
                id="search-destination"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value as AirportCode);
                  setError(null);
                }}
                className="w-full h-12 px-3.5 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#EAB308] focus:border-[#CA8A04] transition-colors"
              >
                {AIRPORTS.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.code} — {airport.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Date */}
            <div className="md:col-span-3">
              <label
                htmlFor="search-date"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                Travel Date
              </label>
              <div className="relative">
                <input
                  id="search-date"
                  type="date"
                  value={travelDate}
                  min={todayISO}
                  max={maxDateISO}
                  onChange={(e) => {
                    setTravelDate(e.target.value);
                    setError(null);
                  }}
                  className="w-full h-12 px-3.5 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-950 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#EAB308] focus:border-[#CA8A04] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Inline validation error */}
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2.5 text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-700" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit row + date summary */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
              <span>
                {travelDate
                  ? `Checking sample fares for ${formatDisplayDate(travelDate)} (default: 14 days from today)`
                  : 'Select a departure date to compare against its 30-day median'}
              </span>
            </p>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] active:bg-[#CA8A04] text-zinc-950 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            >
              <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Check fares</span>
            </button>
          </div>
        </form>

        {/* Hairline divider + Popular routes */}
        <div className="mt-7 pt-6 border-t border-zinc-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs font-semibold text-zinc-700">Popular routes</p>
            <button
              type="button"
              onClick={onLaunchDemo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline decoration-emerald-400 underline-offset-4 transition-colors whitespace-nowrap cursor-pointer self-start sm:self-auto"
            >
              <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Demo Mode: DEL → BOM (BOOK NOW)</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {POPULAR_ROUTES.map((route) => (
              <button
                key={`${route.origin}-${route.destination}`}
                type="button"
                onClick={() => onSelectPopularRoute(route.origin, route.destination, travelDate || initialDate)}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-amber-50 hover:border-[#EAB308] text-xs font-medium text-zinc-800 hover:text-zinc-950 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA8A04]"
              >
                <span className="font-mono font-semibold text-zinc-950">
                  {route.origin} → {route.destination}
                </span>
                <span className="text-zinc-500">{formatDuration(route.typicalDurationMin)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Transparent 3-step methodology explainer */}
      <section aria-label="How FareSense works" className="mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x md:divide-zinc-200">
          <div className="md:pr-7">
            <p className="text-xs font-mono font-semibold text-[#A16207]">01</p>
            <h2 className="mt-1.5 text-base font-bold text-zinc-950">30-Day Median Baseline</h2>
            <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
              Every route is benchmarked against the median of the 30 days preceding your travel date, rather than an inflated single-day peak.
            </p>
          </div>

          <div className="md:px-7">
            <p className="text-xs font-mono font-semibold text-[#A16207]">02</p>
            <h2 className="mt-1.5 text-base font-bold text-zinc-950">0–100 Fare Index</h2>
            <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
              Scores below 35 recommend <strong className="font-semibold text-emerald-800">BOOK NOW</strong>, 35–65 suggest <strong className="font-semibold text-amber-800">WATCH</strong>, and above 65 advise <strong className="font-semibold text-red-800">WAIT</strong>.
            </p>
          </div>

          <div className="md:pl-7">
            <p className="text-xs font-mono font-semibold text-[#A16207]">03</p>
            <h2 className="mt-1.5 text-base font-bold text-zinc-950">Honest Sample Dataset</h2>
            <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
              All 42 domestic pairings between DEL, BOM, BLR, MAA, CCU, HYD, and GOI run on deterministic sample pricing with realistic weekend and advance-booking curves.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
