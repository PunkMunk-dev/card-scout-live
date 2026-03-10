import { Search, Zap } from 'lucide-react';
import { useScanner } from '@/hooks/useScannerState';
import { SCANNER_PRESETS, buildPresetFilters } from '@/lib/scannerPresets';

export function ScannerEmptyState() {
  const { state, runSearch } = useScanner();
  const { recentQueries } = state;

  const quickLaunch = SCANNER_PRESETS.filter(p =>
    ['pokemon-raw', 'one-piece-raw', 'nba-rookies', 'nfl-qbs', 'auctions-ending', 'biggest-discount'].includes(p.id)
  );

  const handlePreset = (preset: typeof SCANNER_PRESETS[0]) => {
    const f = buildPresetFilters(preset);
    if (preset.query) runSearch(preset.query, 1, f, preset.sortBy);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--om-bg-3)' }}>
        <Search className="h-6 w-6" style={{ color: 'var(--om-text-3)' }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--om-text-0)' }}>
        Start scanning
      </p>
      <p className="text-xs mb-6 text-center max-w-sm" style={{ color: 'var(--om-text-3)' }}>
        Search Pokémon, One Piece, basketball, football, and more. Find underpriced active listings faster.
      </p>

      {/* Quick launch */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center mb-6">
        <Zap className="h-3 w-3 shrink-0" style={{ color: 'var(--om-accent)' }} />
        {quickLaunch.map(p => (
          <button
            key={p.id}
            onClick={() => handlePreset(p)}
            className="om-pill om-btn text-[11px]"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Recent */}
      {recentQueries.length > 0 && (
        <div className="w-full max-w-sm">
          <p className="text-[10px] uppercase tracking-wider mb-1.5 text-center" style={{ color: 'var(--om-text-3)' }}>
            Recent
          </p>
          <div className="flex flex-wrap gap-1 justify-center">
            {recentQueries.slice(0, 8).map(q => (
              <button
                key={q}
                onClick={() => runSearch(q)}
                className="om-pill om-btn text-[10px]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
