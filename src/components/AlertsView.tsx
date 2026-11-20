import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Play,
  Trash2,
} from 'lucide-react';
import {
  AIRPORTS,
  AirportCode,
  addDaysISO,
  analyzeRouteFares,
  formatDisplayDate,
  formatINR,
  getDefaultTravelDate,
  getTodayISODate,
} from '../utils/fareLogic';
import {
  evaluateAllAlerts,
  FareAlert,
  validateAlertInput,
} from '../utils/alertLogic';

export interface AlertPrefill {
  origin: AirportCode;
  destination: AirportCode;
  travelDate: string;
  targetFare: number;
  nonce: number;
}

interface AlertsViewProps {
  alerts: FareAlert[];
  prefill: AlertPrefill | null;
  onCreateAlert: (alert: Omit<FareAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (id: string) => void;
  onSimulateCheck: () => void;
  onOpenRoute: (origin: AirportCode, destination: AirportCode, travelDate: string) => void;
  onGoToSearch: () => void;
}

export function AlertsView({
  alerts,
  prefill,
  onCreateAlert,
  onDeleteAlert,
  onSimulateCheck,
  onOpenRoute,
  onGoToSearch,
}: AlertsViewProps) {
  const todayISO = getTodayISODate();
  const maxDateISO = addDaysISO(todayISO, 120);

  const [origin, setOrigin] = useState<AirportCode>(prefill?.origin ?? 'DEL');
  const [destination, setDestination] = useState<AirportCode>(prefill?.destination ?? 'BOM');
  const [travelDate, setTravelDate] = useState<string>(
    prefill?.travelDate ?? getDefaultTravelDate(todayISO),
  );
  const [targetFareInput, setTargetFareInput] = useState<string>(
    prefill ? String(prefill.targetFare) : '4800',
  );
  const [notifyInApp, setNotifyInApp] = useState<boolean>(true);
  const [notifyEmail, setNotifyEmail] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);

  // Apply fresh pre-fill whenever user clicks "Set Fare Alert" from Dashboard
  useEffect(() => {
    if (!prefill) return;
    setOrigin(prefill.origin);
    setDestination(prefill.destination);
    setTravelDate(prefill.travelDate);
    setTargetFareInput(String(prefill.targetFare));
    setErrors([]);
  }, [prefill]);

  // Live benchmark hint for currently selected form route & date
  const livePreview = useMemo(() => {
    if (origin === destination || !travelDate) return null;
    try {
      return analyzeRouteFares(origin, destination, travelDate, todayISO);
    } catch {
      return null;
    }
  }, [origin, destination, travelDate, todayISO]);

  // Evaluate existing alerts against today's deterministic sample fares
  const { evaluations, triggered } = useMemo(
    () => evaluateAllAlerts(alerts, todayISO),
    [alerts, todayISO],
  );

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
    setErrors([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericTarget = Number(targetFareInput);
    const validation = validateAlertInput({
      origin,
      destination,
      travelDate,
      targetFare: numericTarget,
      notifyInApp,
      notifyEmail,
      email,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    onCreateAlert({
      origin,
      destination,
      travelDate,
      targetFare: Math.round(numericTarget),
      notifyInApp,
      notifyEmail,
      email: email.trim(),
    });
  };

  const handlePrefillSample = () => {
    const sampleDate = getDefaultTravelDate(todayISO);
    const sampleAnalysis = analyzeRouteFares('DEL', 'BOM', sampleDate, todayISO);
    setOrigin('DEL');
    setDestination('BOM');
    setTravelDate(sampleDate);
    // Suggest a realistic target right at current lowest fare so Simulate Check shows a match immediately if desired
    setTargetFareInput(String(sampleAnalysis.todayLowestFare));
    setNotifyInApp(true);
    setErrors([]);
  };

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-7 space-y-6">
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500 mb-1">
            <span className="font-semibold text-amber-900">SAMPLE DATA</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Alerts stay in your current browser session</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Fare Alerts
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Track target prices on domestic routes and test alert triggers against today’s sample fares.
          </p>
        </div>

        <button
          type="button"
          onClick={onSimulateCheck}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] active:bg-[#CA8A04] text-zinc-950 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
        >
          <Play className="w-4 h-4 shrink-0 fill-current" aria-hidden="true" />
          <span>Simulate Today’s Check</span>
        </button>
      </section>

      {/* Main 2-column Alerts workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Create Alert Form */}
        <section
          aria-label="Create a new fare alert"
          className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-5 sm:p-6"
        >
          <h2 className="text-base font-bold text-zinc-950">Create Fare Alert</h2>
          <p className="text-xs text-zinc-500 mt-0.5 mb-5">
            Get notified when a route’s lowest fare drops to or below your target.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Origin / Swap / Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 items-end">
              <div className="sm:col-span-5">
                <label
                  htmlFor="alert-origin"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  From
                </label>
                <select
                  id="alert-origin"
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value as AirportCode);
                    setErrors([]);
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} — {a.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  aria-label="Swap alert origin and destination"
                  className="w-full sm:w-9 h-10 sm:h-11 rounded-lg border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="sm:col-span-5">
                <label
                  htmlFor="alert-destination"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  To
                </label>
                <select
                  id="alert-destination"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value as AirportCode);
                    setErrors([]);
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} — {a.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Travel Date & Target Fare */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="alert-date"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Travel Date
                </label>
                <input
                  id="alert-date"
                  type="date"
                  value={travelDate}
                  min={todayISO}
                  max={maxDateISO}
                  onChange={(e) => {
                    setTravelDate(e.target.value);
                    setErrors([]);
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-950 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
                />
              </div>

              <div>
                <label
                  htmlFor="alert-target"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Target Fare (₹ INR)
                </label>
                <input
                  id="alert-target"
                  type="number"
                  min={500}
                  max={100000}
                  step={50}
                  value={targetFareInput}
                  onChange={(e) => {
                    setTargetFareInput(e.target.value);
                    setErrors([]);
                  }}
                  placeholder="e.g. 4800"
                  className="w-full h-11 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-mono font-semibold text-zinc-950 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
                />
              </div>
            </div>

            {/* Live sample route fare reference */}
            {livePreview && (
              <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-600 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span>Current sample lowest:</span>
                  <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                    {formatINR(livePreview.todayLowestFare)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>30-day median:</span>
                  <span className="font-mono font-medium text-zinc-800 tabular-nums">
                    {formatINR(livePreview.median30d)}
                  </span>
                </div>
                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetFareInput(String(livePreview.fairRangeLow))}
                    className="text-[11px] font-semibold text-zinc-800 underline decoration-[#EAB308] underline-offset-2 hover:text-zinc-950 cursor-pointer"
                  >
                    Set to -10% median ({formatINR(livePreview.fairRangeLow)})
                  </button>
                  <span className="text-zinc-300" aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => setTargetFareInput(String(livePreview.todayLowestFare))}
                    className="text-[11px] font-semibold text-zinc-800 underline decoration-[#EAB308] underline-offset-2 hover:text-zinc-950 cursor-pointer"
                  >
                    Match today’s fare
                  </button>
                </div>
              </div>
            )}

            {/* Notification Channels */}
            <fieldset className="pt-1">
              <legend className="text-xs font-semibold text-zinc-700 mb-2">
                Notification method
              </legend>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyInApp}
                    onChange={(e) => {
                      setNotifyInApp(e.target.checked);
                      setErrors([]);
                    }}
                    className="w-4 h-4 rounded border-zinc-300 accent-[#CA8A04]"
                  />
                  <span>In-app</span>
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => {
                      setNotifyEmail(e.target.checked);
                      setErrors([]);
                    }}
                    className="w-4 h-4 rounded border-zinc-300 accent-[#CA8A04]"
                  />
                  <span>Email</span>
                </label>
              </div>
            </fieldset>

            {/* Optional Email Input */}
            <div>
              <label
                htmlFor="alert-email"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                Email address <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                id="alert-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors([]);
                }}
                placeholder="you@example.com"
                className="w-full h-11 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Email delivery is simulated locally in this demo; no real emails are sent.
              </p>
            </div>

            {/* Validation Errors */}
            {errors.length > 0 && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-800 space-y-1"
              >
                {errors.map((err) => (
                  <p key={err} className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-700" aria-hidden="true" />
                    <span>{err}</span>
                  </p>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA8A04]"
            >
              Create Fare Alert
            </button>
          </form>
        </section>

        {/* Right: Active Alerts List */}
        <section
          aria-label="Your active fare alerts"
          className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 border-b border-zinc-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-950">
                Active Alerts ({alerts.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {alerts.length === 0
                  ? 'Add a target price to monitor domestic routes'
                  : `${triggered.length} of ${alerts.length} currently at or below target`}
              </p>
            </div>
            {alerts.length > 0 && (
              <span className="text-xs font-medium text-amber-900">SAMPLE DATA</span>
            )}
          </div>

          {alerts.length === 0 ? (
            /* Friendly Empty State */
            <div className="px-6 py-14 text-center max-w-md mx-auto">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-[#A16207] flex items-center justify-center mx-auto">
                <Bell className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-950">
                No fare alerts set yet
              </h3>
              <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
                Create an alert on the left with your route, travel date, and target price. Then click <strong className="font-semibold text-zinc-900">Simulate Today’s Check</strong> to see instant matches.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePrefillSample}
                  className="px-4 py-2 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  Pre-fill DEL → BOM alert
                </button>
                <button
                  type="button"
                  onClick={onGoToSearch}
                  className="px-4 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Explore routes
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200">
              {evaluations.map(({ alert, currentFare, isTriggered, differenceFromTarget }) => {
                const channels = [
                  alert.notifyInApp ? 'In-app' : null,
                  alert.notifyEmail
                    ? alert.email
                      ? `Email (${alert.email})`
                      : 'Email'
                    : null,
                ].filter(Boolean);

                return (
                  <li key={alert.id} className="p-5 sm:px-6 hover:bg-zinc-50/70 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-base font-bold text-zinc-950">
                            {alert.origin} → {alert.destination}
                          </span>
                          <span className="text-zinc-300" aria-hidden="true">·</span>
                          <span className="text-sm font-medium text-zinc-700">
                            {formatDisplayDate(alert.travelDate)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600">
                          <span>
                            Target:{' '}
                            <strong className="font-mono font-semibold text-zinc-950 tabular-nums">
                              {formatINR(alert.targetFare)}
                            </strong>
                          </span>
                          <span>
                            Current sample:{' '}
                            <strong className="font-mono font-semibold text-zinc-950 tabular-nums">
                              {formatINR(currentFare)}
                            </strong>
                          </span>
                          <span>Channels: {channels.join(', ')}</span>
                        </div>

                        <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold">
                          {isTriggered ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>
                                Target met —{' '}
                                {differenceFromTarget === 0
                                  ? 'matches your target price'
                                  : `${formatINR(Math.abs(differenceFromTarget))} below target`}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-amber-800">
                              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>
                                Watching — currently {formatINR(differenceFromTarget)} above target
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenRoute(alert.origin, alert.destination, alert.travelDate)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <span>Dashboard</span>
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAlert(alert.id)}
                          aria-label={`Delete alert for ${alert.origin} to ${alert.destination} on ${alert.travelDate}`}
                          className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {alerts.length > 0 && (
            <div className="px-5 sm:px-6 py-3.5 border-t border-zinc-200 bg-zinc-50/70 flex items-center gap-2 text-xs text-zinc-600">
              <BellRing className="w-3.5 h-3.5 text-[#A16207] shrink-0" aria-hidden="true" />
              <span>
                Click <strong className="font-semibold text-zinc-900">Simulate Today’s Check</strong> above to evaluate all {alerts.length} active {alerts.length === 1 ? 'alert' : 'alerts'} and trigger match notifications.
              </span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
