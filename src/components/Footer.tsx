export function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-500">
        <p className="font-medium text-zinc-700">
          FareSense · Team AERONOVA · REC · MH26-16
        </p>
        <p className="text-zinc-500 max-w-xl sm:text-right">
          SAMPLE DATA — All route fares, 30-day baselines, and alert checks are deterministically simulated for demonstration and are not live airline quotes.
        </p>
      </div>
    </footer>
  );
}
