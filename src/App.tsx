/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivePage, Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchView } from './components/SearchView';
import { DashboardView } from './components/DashboardView';
import { AlertPrefill, AlertsView } from './components/AlertsView';
import { ToastMessage, ToastStack } from './components/ToastStack';
import {
  AirportCode,
  analyzeRouteFares,
  findBestDemoDate,
  formatDisplayDate,
  formatINR,
  getDefaultTravelDate,
  getTodayISODate,
  RouteFareAnalysis,
} from './utils/fareLogic';
import { evaluateAllAlerts, FareAlert } from './utils/alertLogic';

interface ActiveRouteState {
  origin: AirportCode;
  destination: AirportCode;
  travelDate: string;
  isDemoMode: boolean;
}

export default function App() {
  const referenceToday = useMemo(() => getTodayISODate(), []);
  const defaultTravelDate = useMemo(
    () => getDefaultTravelDate(referenceToday),
    [referenceToday],
  );

  // Allow ?autostart=1 to jump directly to the Demo Mode Dashboard
  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const initialRoute = useMemo<ActiveRouteState>(() => {
    if (initialAutostart) {
      const demo = findBestDemoDate('DEL', 'BOM', referenceToday);
      return {
        origin: demo.origin.code,
        destination: demo.destination.code,
        travelDate: demo.chosenDate,
        isDemoMode: true,
      };
    }
    return {
      origin: 'DEL',
      destination: 'BOM',
      travelDate: defaultTravelDate,
      isDemoMode: false,
    };
  }, [initialAutostart, referenceToday, defaultTravelDate]);

  const [activePage, setActivePage] = useState<ActivePage>(
    initialAutostart ? 'dashboard' : 'search',
  );
  const [activeRoute, setActiveRoute] = useState<ActiveRouteState>(initialRoute);
  const [hasSearched, setHasSearched] = useState<boolean>(initialAutostart);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<FareAlert[]>([]);
  const [alertPrefill, setAlertPrefill] = useState<AlertPrefill | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const loadingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current !== null) {
        window.clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 6500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const transitionToDashboard = useCallback((nextRoute: ActiveRouteState) => {
    if (loadingTimerRef.current !== null) {
      window.clearTimeout(loadingTimerRef.current);
    }
    setActiveRoute(nextRoute);
    setHasSearched(true);
    setActivePage('dashboard');
    setIsLoadingDashboard(true);
    loadingTimerRef.current = window.setTimeout(() => {
      setIsLoadingDashboard(false);
      loadingTimerRef.current = null;
    }, 240);
  }, []);

  const handleSearchSubmit = useCallback(
    (origin: AirportCode, destination: AirportCode, travelDate: string) => {
      transitionToDashboard({ origin, destination, travelDate, isDemoMode: false });
    },
    [transitionToDashboard],
  );

  const handleLaunchDemo = useCallback(() => {
    const demo = findBestDemoDate('DEL', 'BOM', referenceToday);
    transitionToDashboard({
      origin: demo.origin.code,
      destination: demo.destination.code,
      travelDate: demo.chosenDate,
      isDemoMode: true,
    });
  }, [referenceToday, transitionToDashboard]);

  const handleChangeDashboardDate = useCallback((newDate: string) => {
    setActiveRoute((prev) => ({
      ...prev,
      travelDate: newDate,
      isDemoMode: false,
    }));
  }, []);

  const handleSetAlertFromDashboard = useCallback((analysis: RouteFareAnalysis) => {
    // Suggest a realistic target: 10% below 30-day median (or slightly below today's fare if already below)
    const suggestedTarget =
      analysis.todayLowestFare <= analysis.fairRangeLow
        ? Math.max(500, Math.round((analysis.todayLowestFare * 0.95) / 50) * 50)
        : Math.round(analysis.fairRangeLow / 50) * 50;

    setAlertPrefill({
      origin: analysis.origin.code,
      destination: analysis.destination.code,
      travelDate: analysis.chosenDate,
      targetFare: suggestedTarget,
      nonce: Date.now(),
    });
    setActivePage('alerts');
  }, []);

  const handleCreateAlert = useCallback(
    (draft: Omit<FareAlert, 'id' | 'createdAt'>) => {
      const created: FareAlert = {
        ...draft,
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: referenceToday,
      };
      setAlerts((prev) => [created, ...prev]);
      pushToast({
        tone: 'success',
        title: `Fare alert saved: ${created.origin} → ${created.destination}`,
        description: `Watching ${formatDisplayDate(created.travelDate)} for ${formatINR(created.targetFare)} or less.`,
      });
    },
    [referenceToday, pushToast],
  );

  const handleDeleteAlert = useCallback(
    (id: string) => {
      setAlerts((prev) => prev.filter((item) => item.id !== id));
      pushToast({
        tone: 'neutral',
        title: 'Fare alert removed',
        description: 'The route has been removed from your active watchlist.',
      });
    },
    [pushToast],
  );

  const handleSimulateCheck = useCallback(() => {
    if (alerts.length === 0) {
      pushToast({
        tone: 'neutral',
        title: 'No active alerts to check',
        description: 'Create at least one fare alert first, then simulate today’s fare check.',
      });
      return;
    }

    const { triggered } = evaluateAllAlerts(alerts, referenceToday);

    if (triggered.length === 0) {
      pushToast({
        tone: 'neutral',
        title: `Checked ${alerts.length} ${alerts.length === 1 ? 'alert' : 'alerts'} — no target matches yet`,
        description:
          'None of your watched routes are at or below your target price in today’s sample fares.',
      });
      return;
    }

    triggered.slice(0, 3).forEach(({ alert, currentFare }) => {
      const emailNote = alert.notifyEmail
        ? alert.email
          ? ` (Simulated email queued to ${alert.email})`
          : ' (Simulated email alert enabled)'
        : '';
      pushToast({
        tone: 'alert',
        title: `Fare drop match: ${alert.origin} → ${alert.destination} at ${formatINR(currentFare)}`,
        description: `${formatDisplayDate(alert.travelDate)} hit your target of ${formatINR(alert.targetFare)}.${emailNote}`,
      });
    });
  }, [alerts, referenceToday, pushToast]);

  const currentAnalysis = useMemo(
    () =>
      analyzeRouteFares(
        activeRoute.origin,
        activeRoute.destination,
        activeRoute.travelDate,
        referenceToday,
      ),
    [activeRoute, referenceToday],
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] text-[#18181B]">
      <Header
        activePage={activePage}
        hasDashboardRoute={hasSearched}
        alertCount={alerts.length}
        onNavigate={(page) => {
          if (page === 'dashboard' && !hasSearched) {
            setHasSearched(true);
          }
          setActivePage(page);
        }}
        onLaunchDemo={handleLaunchDemo}
      />

      <div className="flex-1">
        {activePage === 'search' && (
          <SearchView
            initialOrigin={activeRoute.origin}
            initialDestination={activeRoute.destination}
            initialDate={activeRoute.travelDate}
            onSearchSubmit={handleSearchSubmit}
            onSelectPopularRoute={handleSearchSubmit}
            onLaunchDemo={handleLaunchDemo}
          />
        )}

        {activePage === 'dashboard' && (
          <DashboardView
            analysis={currentAnalysis}
            isLoading={isLoadingDashboard}
            isDemoMode={activeRoute.isDemoMode}
            onChangeDate={handleChangeDashboardDate}
            onEditSearch={() => setActivePage('search')}
            onSetAlert={handleSetAlertFromDashboard}
          />
        )}

        {activePage === 'alerts' && (
          <AlertsView
            alerts={alerts}
            prefill={alertPrefill}
            onCreateAlert={handleCreateAlert}
            onDeleteAlert={handleDeleteAlert}
            onSimulateCheck={handleSimulateCheck}
            onOpenRoute={(origin, destination, travelDate) =>
              transitionToDashboard({ origin, destination, travelDate, isDemoMode: false })
            }
            onGoToSearch={() => setActivePage('search')}
          />
        )}
      </div>

      <Footer />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
