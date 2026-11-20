import { Plane, TrendingDown } from 'lucide-react';

export type ActivePage = 'search' | 'dashboard' | 'alerts';

interface HeaderProps {
  activePage: ActivePage;
  hasDashboardRoute: boolean;
  alertCount: number;
  onNavigate: (page: ActivePage) => void;
  onLaunchDemo: () => void;
}

export function Header({
  activePage,
  hasDashboardRoute,
  alertCount,
  onNavigate,
  onLaunchDemo,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand wordmark + mandatory SAMPLE DATA disclosure */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="flex items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA8A04] rounded-md cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-[#FACC15] text-zinc-950 flex items-center justify-center shrink-0">
              <Plane className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-zinc-950 whitespace-nowrap">
              FareSense
            </span>
          </button>
          <span
            className="hidden sm:inline-block text-[11px] font-semibold tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded whitespace-nowrap shrink-0"
            title="All displayed flight prices are deterministic sample data"
          >
            SAMPLE DATA
          </span>
        </div>

        {/* Zone 2: Clean single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          <button
            type="button"
            onClick={() => onNavigate('search')}
            aria-current={activePage === 'search' ? 'page' : undefined}
            className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA8A04] ${
              activePage === 'search'
                ? 'text-zinc-950 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Search
            {activePage === 'search' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#EAB308]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            aria-current={activePage === 'dashboard' ? 'page' : undefined}
            className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA8A04] ${
              activePage === 'dashboard'
                ? 'text-zinc-950 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            {hasDashboardRoute ? 'Dashboard' : 'Fare Dashboard'}
            {activePage === 'dashboard' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#EAB308]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            aria-current={activePage === 'alerts' ? 'page' : undefined}
            className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA8A04] ${
              activePage === 'alerts'
                ? 'text-zinc-950 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            {alertCount > 0 ? `Fare Alerts (${alertCount})` : 'Fare Alerts'}
            {activePage === 'alerts' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#EAB308]" aria-hidden="true" />
            )}
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onLaunchDemo}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-950 bg-[#FACC15] hover:bg-[#EAB308] active:bg-[#CA8A04] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
          >
            <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Demo Mode</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation strip (non-sticky, compact, single-line controls) */}
      <div className="md:hidden border-t border-zinc-100 px-4 py-2 flex items-center justify-between gap-2 bg-zinc-50/70">
        <nav aria-label="Mobile navigation" className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('search')}
            aria-current={activePage === 'search' ? 'page' : undefined}
            className={`text-xs font-medium py-1.5 whitespace-nowrap shrink-0 ${
              activePage === 'search'
                ? 'text-zinc-950 font-semibold border-b-2 border-[#EAB308]'
                : 'text-zinc-600'
            }`}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            aria-current={activePage === 'dashboard' ? 'page' : undefined}
            className={`text-xs font-medium py-1.5 whitespace-nowrap shrink-0 ${
              activePage === 'dashboard'
                ? 'text-zinc-950 font-semibold border-b-2 border-[#EAB308]'
                : 'text-zinc-600'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            aria-current={activePage === 'alerts' ? 'page' : undefined}
            className={`text-xs font-medium py-1.5 whitespace-nowrap shrink-0 ${
              activePage === 'alerts'
                ? 'text-zinc-950 font-semibold border-b-2 border-[#EAB308]'
                : 'text-zinc-600'
            }`}
          >
            {alertCount > 0 ? `Alerts (${alertCount})` : 'Alerts'}
          </button>
        </nav>
        <span className="sm:hidden text-[10px] font-semibold tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
          SAMPLE DATA
        </span>
      </div>
    </header>
  );
}
