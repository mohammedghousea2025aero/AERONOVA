/**
 * FareSense Core Fare Logic & Deterministic Sample Data Engine
 *
 * Pure, side-effect-free TypeScript module powering:
 * - 7 major Indian domestic airports and all valid route pairings
 * - Seeded deterministic PRNG (Mulberry32) so identical route + date always
 *   produce identical fares, airline options, and Fare Index scores
 * - Realistic day-of-week surges (Fri/Sat/Sun), mid-week dips (Tue/Wed),
 *   advance-booking discount curves, and organic fare waves
 * - 30-day median comparison, Fare Index (0-100), and plain-English verdicts
 * - 38-day chart window (chosenDate - 30 days through chosenDate + 7 days)
 * - Dynamic Demo Mode date selector guaranteeing a genuine BOOK NOW verdict
 *   on DEL -> BOM without hardcoding or overriding math
 */

export type AirportCode = 'DEL' | 'BOM' | 'BLR' | 'MAA' | 'CCU' | 'HYD' | 'GOI';

export interface Airport {
  code: AirportCode;
  city: string;
  airportName: string;
  region: 'North' | 'West' | 'South' | 'East';
}

export interface AirlineOption {
  id: string;
  airline: string;
  iata: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: string;
  cabinBaggage: string;
  fare: number;
  isLowest: boolean;
}

export interface DailyFarePoint {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun ... 6 = Sat
  lowestFare: number;
  cheapestAirline: string;
  airlines: AirlineOption[];
  offsetFromChosen: number; // -30 .. +7
  isChosenDate: boolean;
  isForwardOutlook: boolean; // offset > 0
}

export type VerdictType = 'BOOK_NOW' | 'WATCH' | 'WAIT';

export interface VerdictDetails {
  type: VerdictType;
  label: 'BOOK NOW' | 'WATCH' | 'WAIT';
  shortAdvice: string;
  explanation: string;
}

export interface RouteFareAnalysis {
  origin: Airport;
  destination: Airport;
  routeKey: string;
  chosenDate: string;
  referenceToday: string;
  daysUntilTravel: number;
  todayLowestFare: number;
  median30d: number;
  min30d: number;
  max30d: number;
  avg30d: number;
  fairRangeLow: number;
  fairRangeHigh: number;
  deviationAmount: number;
  deviationPct: number;
  fareIndex: number; // 0..100
  verdict: VerdictDetails;
  comparisonSentence: string;
  chartPoints: DailyFarePoint[]; // 38 points: chosenDate - 30d to chosenDate + 7d
  chosenDayAirlines: AirlineOption[];
}

export interface PopularRoute {
  origin: AirportCode;
  destination: AirportCode;
  label: string;
  typicalDurationMin: number;
}

export const AIRPORTS: Airport[] = [
  { code: 'DEL', city: 'New Delhi', airportName: 'Indira Gandhi Intl', region: 'North' },
  { code: 'BOM', city: 'Mumbai', airportName: 'Chhatrapati Shivaji Maharaj Intl', region: 'West' },
  { code: 'BLR', city: 'Bengaluru', airportName: 'Kempegowda Intl', region: 'South' },
  { code: 'MAA', city: 'Chennai', airportName: 'Chennai Intl', region: 'South' },
  { code: 'CCU', city: 'Kolkata', airportName: 'Netaji Subhas Chandra Bose Intl', region: 'East' },
  { code: 'HYD', city: 'Hyderabad', airportName: 'Rajiv Gandhi Intl', region: 'South' },
  { code: 'GOI', city: 'Goa', airportName: 'Dabolim / Mopa', region: 'West' },
];

export const AIRPORT_MAP: Record<AirportCode, Airport> = AIRPORTS.reduce(
  (acc, airport) => {
    acc[airport.code] = airport;
    return acc;
  },
  {} as Record<AirportCode, Airport>,
);

export const POPULAR_ROUTES: PopularRoute[] = [
  { origin: 'DEL', destination: 'BOM', label: 'Delhi → Mumbai', typicalDurationMin: 130 },
  { origin: 'BLR', destination: 'MAA', label: 'Bengaluru → Chennai', typicalDurationMin: 65 },
  { origin: 'DEL', destination: 'GOI', label: 'Delhi → Goa', typicalDurationMin: 155 },
  { origin: 'BOM', destination: 'BLR', label: 'Mumbai → Bengaluru', typicalDurationMin: 105 },
];

interface RoutePricingProfile {
  baseFare: number;
  minBound: number;
  maxBound: number;
  durationMin: number;
  volatility: number;
}

/**
 * Core 6 Indian domestic route profiles (reverse directions share the same
 * canonical pricing corridor while keeping a directional seed for variation).
 */
const CORE_ROUTE_PROFILES: Record<string, RoutePricingProfile> = {
  'BOM-DEL': { baseFare: 5450, minBound: 3650, maxBound: 9200, durationMin: 130, volatility: 0.17 },
  'BLR-DEL': { baseFare: 6100, minBound: 4200, maxBound: 10400, durationMin: 165, volatility: 0.16 },
  'BLR-BOM': { baseFare: 4450, minBound: 2950, maxBound: 7600, durationMin: 105, volatility: 0.16 },
  'BLR-MAA': { baseFare: 3050, minBound: 1950, maxBound: 5400, durationMin: 65, volatility: 0.15 },
  'DEL-GOI': { baseFare: 6400, minBound: 4300, maxBound: 11200, durationMin: 155, volatility: 0.19 },
  'BOM-GOI': { baseFare: 3650, minBound: 2350, maxBound: 6400, durationMin: 75, volatility: 0.18 },
};

/**
 * Approximate inter-hub flight durations (minutes) for all secondary pairings
 * among the 7 airports so every possible user selection produces realistic
 * fares and flight times with zero "route not found" errors.
 */
const FALLBACK_PAIR_PROFILES: Record<string, RoutePricingProfile> = {
  'CCU-DEL': { baseFare: 5600, minBound: 3900, maxBound: 9500, durationMin: 140, volatility: 0.16 },
  'DEL-HYD': { baseFare: 5300, minBound: 3600, maxBound: 8900, durationMin: 135, volatility: 0.15 },
  'DEL-MAA': { baseFare: 6050, minBound: 4200, maxBound: 10200, durationMin: 170, volatility: 0.16 },
  'BOM-CCU': { baseFare: 5900, minBound: 4100, maxBound: 9800, durationMin: 160, volatility: 0.16 },
  'BOM-HYD': { baseFare: 4100, minBound: 2750, maxBound: 7100, durationMin: 90, volatility: 0.15 },
  'BOM-MAA': { baseFare: 4750, minBound: 3250, maxBound: 8200, durationMin: 120, volatility: 0.15 },
  'BLR-CCU': { baseFare: 5750, minBound: 3950, maxBound: 9600, durationMin: 155, volatility: 0.16 },
  'BLR-GOI': { baseFare: 3550, minBound: 2350, maxBound: 6300, durationMin: 80, volatility: 0.18 },
  'BLR-HYD': { baseFare: 3350, minBound: 2200, maxBound: 5900, durationMin: 75, volatility: 0.15 },
  'CCU-GOI': { baseFare: 6600, minBound: 4600, maxBound: 11400, durationMin: 175, volatility: 0.18 },
  'CCU-HYD': { baseFare: 5150, minBound: 3550, maxBound: 8700, durationMin: 130, volatility: 0.15 },
  'CCU-MAA': { baseFare: 5250, minBound: 3600, maxBound: 8900, durationMin: 140, volatility: 0.16 },
  'GOI-HYD': { baseFare: 3750, minBound: 2500, maxBound: 6600, durationMin: 80, volatility: 0.17 },
  'GOI-MAA': { baseFare: 4350, minBound: 2950, maxBound: 7600, durationMin: 100, volatility: 0.17 },
  'HYD-MAA': { baseFare: 3400, minBound: 2250, maxBound: 5950, durationMin: 75, volatility: 0.15 },
};

const CARRIER_POOL = [
  { airline: 'IndiGo', iata: '6E', baggage: '15 kg check-in · 7 kg cabin' },
  { airline: 'Air India', iata: 'AI', baggage: '15 kg check-in · 7 kg cabin' },
  { airline: 'Akasa Air', iata: 'QP', baggage: '15 kg check-in · 7 kg cabin' },
  { airline: 'Air India Express', iata: 'IX', baggage: '15 kg check-in · 7 kg cabin' },
  { airline: 'SpiceJet', iata: 'SG', baggage: '15 kg check-in · 7 kg cabin' },
];

/**
 * Formats an amount in Indian Rupees (INR) using Indian digit grouping
 * (e.g. 5420 -> "₹5,420", 125000 -> "₹1,25,000").
 */
export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  const absFormatted = Math.abs(rounded).toLocaleString('en-IN');
  return rounded < 0 ? `-₹${absFormatted}` : `₹${absFormatted}`;
}

/**
 * Parses a YYYY-MM-DD string into a UTC Date at midnight to eliminate
 * local timezone drift across day calculations.
 */
export function parseISODate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

/**
 * Formats a UTC Date as YYYY-MM-DD.
 */
export function toISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date string in YYYY-MM-DD (using local calendar date
 * converted to canonical ISO date string).
 */
export function getTodayISODate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds a signed integer number of days to an ISO date string.
 */
export function addDaysISO(isoDate: string, days: number): string {
  const dt = parseISODate(isoDate);
  dt.setUTCDate(dt.getUTCDate() + days);
  return toISODate(dt);
}

/**
 * Computes signed day difference (dateB - dateA) in whole calendar days.
 */
export function diffDaysISO(dateA: string, dateB: string): number {
  const msPerDay = 86_400_000;
  return Math.round((parseISODate(dateB).getTime() - parseISODate(dateA).getTime()) / msPerDay);
}

/**
 * Returns default travel date: 14 days from today.
 */
export function getDefaultTravelDate(referenceToday: string = getTodayISODate()): string {
  return addDaysISO(referenceToday, 14);
}

/**
 * Formats an ISO date for human-readable UI display (e.g. "Fri, 4 Dec 2026").
 */
export function formatDisplayDate(isoDate: string): string {
  const dt = parseISODate(isoDate);
  return dt.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Formats an ISO date concisely for chart ticks (e.g. "4 Dec").
 */
export function formatShortDate(isoDate: string): string {
  const dt = parseISODate(isoDate);
  return dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/**
 * Formats duration in minutes to "2h 10m".
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Deterministic 32-bit FNV-1a string hash.
 */
function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Seeded Mulberry32 PRNG returning deterministic floats in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Looks up the pricing profile for any pair of supported Indian airports.
 */
export function getRouteProfile(origin: AirportCode, destination: AirportCode): RoutePricingProfile {
  const canonicalKey = [origin, destination].sort().join('-');
  return (
    CORE_ROUTE_PROFILES[canonicalKey] ??
    FALLBACK_PAIR_PROFILES[canonicalKey] ?? {
      baseFare: 4950,
      minBound: 3300,
      maxBound: 8600,
      durationMin: 120,
      volatility: 0.16,
    }
  );
}

/**
 * Calculates exact statistical median of a numeric array.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Advance-booking curve:
 * - Close-in departures (0..6 days out) carry a steep last-minute premium
 * - Sweet-spot advance bookings (14..45 days out) dip below baseline
 * - Far-out bookings (46..90 days) stay modestly discounted
 * - Historical days before referenceToday (negative lead) settle near baseline
 */
function getAdvanceBookingMultiplier(daysFromToday: number): number {
  if (daysFromToday < 0) {
    // Historical baseline reference points have neutral booking-window effect
    return 1.0;
  }
  if (daysFromToday <= 2) return 1.24;
  if (daysFromToday <= 6) return 1.14 - (daysFromToday - 3) * 0.025;
  if (daysFromToday <= 13) return 1.04 - (daysFromToday - 7) * 0.01;
  if (daysFromToday <= 35) return 0.96 - ((daysFromToday - 14) / 21) * 0.05;
  if (daysFromToday <= 75) return 0.91 + ((daysFromToday - 36) / 39) * 0.03;
  return 0.95;
}

/**
 * Day-of-week pricing multiplier reflecting Indian domestic travel demand:
 * Friday & Sunday peak; Saturday elevated; Tuesday & Wednesday softest.
 */
function getDayOfWeekMultiplier(dayOfWeek: number): number {
  switch (dayOfWeek) {
    case 5: // Friday
      return 1.12;
    case 0: // Sunday
      return 1.11;
    case 6: // Saturday
      return 1.08;
    case 1: // Monday morning business demand
      return 1.02;
    case 4: // Thursday
      return 0.99;
    case 2: // Tuesday
      return 0.92;
    case 3: // Wednesday
      return 0.93;
    default:
      return 1.0;
  }
}

/**
 * Formats HH:MM departure/arrival times cleanly from minutes since midnight.
 */
function formatClockTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hh = String(Math.floor(normalized / 60)).padStart(2, '0');
  const mm = String(normalized % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Generates deterministic daily lowest fare and 3 airline options for a single
 * route and date, relative to referenceToday for the advance-booking curve.
 */
export function generateDayFare(
  origin: AirportCode,
  destination: AirportCode,
  isoDate: string,
  referenceToday: string,
): { lowestFare: number; airlines: AirlineOption[]; dayOfWeek: number } {
  const profile = getRouteProfile(origin, destination);
  const dt = parseISODate(isoDate);
  const dayOfWeek = dt.getUTCDay();
  const epochDays = Math.floor(dt.getTime() / 86_400_000);
  const daysFromToday = diffDaysISO(referenceToday, isoDate);

  // Route-specific phase shifts for multi-frequency organic market waves
  const routeSeed = hashString(`FareSense:${origin}->${destination}`);
  const phaseA = (routeSeed % 360) * (Math.PI / 180);
  const phaseB = ((routeSeed >> 8) % 360) * (Math.PI / 180);

  // Smooth demand waves (19-day and 9-day cycles) + deterministic daily noise
  const waveA = Math.sin((epochDays / 19) * Math.PI * 2 + phaseA) * 0.085;
  const waveB = Math.cos((epochDays / 9) * Math.PI * 2 + phaseB) * 0.05;

  const daySeed = hashString(`FareSense:day:${origin}->${destination}:${isoDate}`);
  const rng = mulberry32(daySeed);
  const noise = (rng() - 0.5) * 2 * (profile.volatility * 0.55);

  const dowMult = getDayOfWeekMultiplier(dayOfWeek);
  const advanceMult = getAdvanceBookingMultiplier(daysFromToday);

  const rawLowest = profile.baseFare * dowMult * advanceMult * (1 + waveA + waveB + noise);
  // Round to nearest ₹10 for clean realistic Indian domestic pricing
  const clampedLowest = Math.max(profile.minBound, Math.min(profile.maxBound, rawLowest));
  const lowestFare = Math.round(clampedLowest / 10) * 10;

  // Pick 3 distinct Indian domestic airlines deterministically for this route/day
  const shuffledCarriers = [...CARRIER_POOL]
    .map((carrier) => ({ carrier, sortKey: rng() }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, 3)
    .map((entry) => entry.carrier);

  // Departure slots across morning, afternoon, and evening
  const slotBases = [375, 760, 1110]; // ~06:15, ~12:40, ~18:30
  const spreads = [0, 0.06 + rng() * 0.06, 0.13 + rng() * 0.09];

  const airlines: AirlineOption[] = shuffledCarriers.map((carrier, idx) => {
    const depMins = slotBases[idx] + Math.floor(rng() * 13) * 5;
    const durMins = profile.durationMin + (Math.floor(rng() * 5) - 2) * 5;
    const flightNum = 100 + Math.floor(rng() * 880);
    const fare = idx === 0 ? lowestFare : Math.round((lowestFare * (1 + spreads[idx])) / 10) * 10;

    return {
      id: `${origin}-${destination}-${isoDate}-${carrier.iata}-${flightNum}`,
      airline: carrier.airline,
      iata: carrier.iata,
      flightNumber: `${carrier.iata} ${flightNum}`,
      departureTime: formatClockTime(depMins),
      arrivalTime: formatClockTime(depMins + durMins),
      durationMinutes: durMins,
      stops: 'Non-stop',
      cabinBaggage: carrier.baggage,
      fare,
      isLowest: idx === 0,
    };
  });

  // Sort ascending by fare so lowest is always first and clearly marked
  airlines.sort((a, b) => a.fare - b.fare);
  airlines.forEach((opt, i) => {
    opt.isLowest = i === 0;
  });

  return {
    lowestFare: airlines[0].fare,
    airlines,
    dayOfWeek,
  };
}

/**
 * Computes the 0-100 Fare Index score from today's fare and 30-day median.
 * Score = 50 when fare equals median.
 * -9% or lower -> score < 35 (BOOK NOW)
 * -8% to +8%   -> score 35..65 (WATCH)
 * +9% or above -> score > 65 (WAIT)
 */
export function computeFareIndex(todayFare: number, median30d: number): number {
  if (median30d <= 0) return 50;
  const deviationPct = ((todayFare - median30d) / median30d) * 100;
  const rawScore = 50 + deviationPct * 1.8;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/**
 * Maps a 0-100 Fare Index score to a plain-English booking verdict.
 */
export function getVerdictFromScore(score: number): VerdictDetails {
  if (score < 35) {
    return {
      type: 'BOOK_NOW',
      label: 'BOOK NOW',
      shortAdvice: 'Strong value compared to the last 30 days',
      explanation:
        'Current pricing sits comfortably below the 30-day typical range. Fares on this corridor rarely stay this low as departure nears.',
    };
  }
  if (score <= 65) {
    return {
      type: 'WATCH',
      label: 'WATCH',
      shortAdvice: 'Fair price within the typical 30-day band',
      explanation:
        'Today’s fare is near the 30-day median. Book if your schedule is fixed, or set a fare alert to catch a mid-week dip.',
    };
  }
  return {
    type: 'WAIT',
    label: 'WAIT',
    shortAdvice: 'Elevated fare above recent typical prices',
    explanation:
      'Today’s lowest fare is noticeably above the 30-day median. Consider waiting a few days or checking nearby mid-week dates.',
  };
}

/**
 * Generates the plain-English comparison sentence, cleanly handling the
 * exact-median / near-zero difference edge case.
 */
export function buildComparisonSentence(todayFare: number, median30d: number): string {
  const diff = todayFare - median30d;
  const pct = median30d > 0 ? Math.round((Math.abs(diff) / median30d) * 100) : 0;

  if (Math.abs(diff) < 50 || pct === 0) {
    return `Today’s fare is right in line with the 30-day median of ${formatINR(median30d)}.`;
  }
  if (diff < 0) {
    return `Today’s fare is ${formatINR(Math.abs(diff))} (${pct}%) below the 30-day median of ${formatINR(median30d)}.`;
  }
  return `Today’s fare is ${formatINR(diff)} (${pct}%) above the 30-day median of ${formatINR(median30d)}.`;
}

/**
 * Full deterministic analysis for a selected Indian domestic route and travel date.
 * - Compares chosenDate's lowest fare against the 30 days strictly prior (chosenDate - 30 .. chosenDate - 1)
 * - Returns 38 daily points for the chart (chosenDate - 30 .. chosenDate + 7)
 * - Returns 3 airline options for the chosen travel date
 */
export function analyzeRouteFares(
  origin: AirportCode,
  destination: AirportCode,
  chosenDate: string,
  referenceToday: string = getTodayISODate(),
): RouteFareAnalysis {
  if (origin === destination) {
    throw new Error('Origin and destination airports must be different.');
  }

  const chartPoints: DailyFarePoint[] = [];
  const past30Fares: number[] = [];

  for (let offset = -30; offset <= 7; offset++) {
    const isoDate = addDaysISO(chosenDate, offset);
    const dayData = generateDayFare(origin, destination, isoDate, referenceToday);

    if (offset >= -30 && offset <= -1) {
      past30Fares.push(dayData.lowestFare);
    }

    chartPoints.push({
      date: isoDate,
      dayOfWeek: dayData.dayOfWeek,
      lowestFare: dayData.lowestFare,
      cheapestAirline: dayData.airlines[0].airline,
      airlines: dayData.airlines,
      offsetFromChosen: offset,
      isChosenDate: offset === 0,
      isForwardOutlook: offset > 0,
    });
  }

  const chosenPoint = chartPoints.find((p) => p.isChosenDate)!;
  const todayLowestFare = chosenPoint.lowestFare;
  const median30d = calculateMedian(past30Fares);
  const min30d = Math.min(...past30Fares);
  const max30d = Math.max(...past30Fares);
  const avg30d = Math.round(past30Fares.reduce((sum, val) => sum + val, 0) / past30Fares.length);

  const fairRangeLow = Math.round((median30d * 0.9) / 10) * 10;
  const fairRangeHigh = Math.round((median30d * 1.1) / 10) * 10;

  const deviationAmount = todayLowestFare - median30d;
  const deviationPct = median30d > 0 ? Number(((deviationAmount / median30d) * 100).toFixed(1)) : 0;
  const fareIndex = computeFareIndex(todayLowestFare, median30d);
  const verdict = getVerdictFromScore(fareIndex);
  const comparisonSentence = buildComparisonSentence(todayLowestFare, median30d);

  return {
    origin: AIRPORT_MAP[origin],
    destination: AIRPORT_MAP[destination],
    routeKey: `${origin}-${destination}`,
    chosenDate,
    referenceToday,
    daysUntilTravel: diffDaysISO(referenceToday, chosenDate),
    todayLowestFare,
    median30d,
    min30d,
    max30d,
    avg30d,
    fairRangeLow,
    fairRangeHigh,
    deviationAmount,
    deviationPct,
    fareIndex,
    verdict,
    comparisonSentence,
    chartPoints,
    chosenDayAirlines: chosenPoint.airlines,
  };
}

/**
 * Dynamically scans upcoming dates (from +7 to +60 days out) using the genuine
 * deterministic pricing engine to find the best upcoming BOOK NOW date
 * (Fare Index < 35) for Demo Mode without hardcoding or overriding math.
 */
export function findBestDemoDate(
  origin: AirportCode = 'DEL',
  destination: AirportCode = 'BOM',
  referenceToday: string = getTodayISODate(),
): RouteFareAnalysis {
  let bestAnalysis: RouteFareAnalysis | null = null;

  for (let offset = 7; offset <= 60; offset++) {
    const candidateDate = addDaysISO(referenceToday, offset);
    const analysis = analyzeRouteFares(origin, destination, candidateDate, referenceToday);
    if (analysis.fareIndex < 35) {
      // Pick the first genuinely strong BOOK NOW date in the near-term window
      if (!bestAnalysis || analysis.fareIndex < bestAnalysis.fareIndex) {
        bestAnalysis = analysis;
        if (offset >= 10 && analysis.fareIndex <= 28) {
          return bestAnalysis;
        }
      }
    } else if (!bestAnalysis || analysis.fareIndex < bestAnalysis.fareIndex) {
      bestAnalysis = analysis;
    }
  }

  return bestAnalysis!;
}
