import { Search, Compass, TrendingUp } from 'lucide-react';
import { useScanner } from '@/hooks/useScannerState';
import type { MarketMode } from '@/types/scanner';

/* ── Lane / search data by market mode ── */

const SUGGESTED_LANES: Record<MarketMode, { label: string; query: string }[]> = {
  tcg: [
    { label: 'One Piece Alt Arts', query: 'one piece alt art' },
    { label: 'Pokémon IR / SIR', query: 'pokemon SIR' },
    { label: 'Manga Rares', query: 'manga rare' },
    { label: 'Popular Waifus', query: 'waifu card' },
    { label: 'High Gem Rate Cards', query: 'gem mint card' },
    { label: 'Cards Under $100', query: 'tcg card' },
    { label: 'Raw → PSA 10', query: 'raw psa 10' },
    { label: 'Top Starter Deck Cards', query: 'starter deck card' },
  ],
  sports: [
    { label: 'NBA Rookies', query: 'nba rookie prizm' },
    { label: 'NFL QBs', query: 'nfl quarterback prizm' },
    { label: 'Top Prospects', query: 'bowman chrome prospect' },
    { label: 'Prizm Silvers', query: 'prizm silver' },
    { label: 'Low Pop Autos', query: 'auto low pop' },
    { label: 'Liquid Players', query: 'liquid star card' },
    { label: 'Cards Under $150', query: 'sports card raw' },
    { label: 'Raw → PSA 10', query: 'raw psa 10' },
  ],
  all: [
    { label: 'One Piece Alt Arts', query: 'one piece alt art' },
    { label: 'Pokémon SIR', query: 'pokemon SIR' },
    { label: 'NBA Rookies', query: 'nba rookie prizm' },
    { label: 'NFL QBs', query: 'nfl quarterback prizm' },
    { label: 'Raw → PSA 10', query: 'raw psa 10' },
    { label: 'Ending Soon', query: 'ending soon card' },
  ],
};

const POPULAR_SEARCHES: Record<MarketMode, string[]> = {
  tcg: [
    'Boa Hancock OP07 Alt Art',
    'Monkey D. Luffy Manga',
    'Roronoa Zoro OP01',
    'Charizard SIR',
    'Pikachu Promo',
    'Eevee IR',
  ],
  sports: [
    'Anthony Edwards Prizm',
    'CJ Stroud Prizm',
    'Jayden Daniels Auto',
    'Victor Wembanyama Rookie',
    'Shohei Ohtani Chrome',
    'Patrick Mahomes Select',
  ],
  all: [
    'One Piece card',
    'Shohei Ohtani Topps Chrome',
    'mega charizard',
    'Luffy Alt Art',
    'NBA rookie prizm',
  ],
};

export function ScannerEmptyState() {
  const { state, runSearch } = useScanner();
  const { recentQueries, filters } = state;
  const mode = filters.marketMode;

  const lanes = SUGGESTED_LANES[mode];
  const popular = POPULAR_SEARCHES[mode];

  const chip = (label: string, query: string) => (
    <button
      key={label}
      onClick={() => runSearch(query)}
      className="om-pill om-btn text-[11px]"
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-xl mx-auto w-full">
      {/* Hero icon + copy */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--om-bg-3)' }}>
        <Search className="h-5 w-5" style={{ color: 'var(--om-text-3)' }} />
      </div>
      <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--om-text-0)' }}>
        Find better cards faster
      </p>
      <p className="text-[11px] mb-6 text-center leading-relaxed max-w-xs" style={{ color: 'var(--om-text-3)' }}>
        Search by player, character, set, or card number — or start with a suggested lane below.
      </p>

      {/* Suggested Lanes */}
      <div className="w-full mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <Compass className="h-3 w-3" style={{ color: 'var(--om-accent)' }} />
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--om-text-2)' }}>
            Suggested Lanes
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {lanes.map(l => chip(l.label, l.query))}
        </div>
      </div>

      {/* Popular Searches */}
      <div className="w-full mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="h-3 w-3" style={{ color: 'var(--om-accent)' }} />
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--om-text-2)' }}>
            Popular Searches
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {popular.map(q => chip(q, q))}
        </div>
      </div>

      {/* Recent */}
      {recentQueries.length > 0 && (
        <div className="w-full">
          <span className="text-[10px] uppercase tracking-wider font-medium mb-2 block" style={{ color: 'var(--om-text-3)' }}>
            Recent
          </span>
          <div className="flex flex-wrap gap-1.5">
            {recentQueries.slice(0, 6).map(q => chip(q, q))}
          </div>
        </div>
      )}
    </div>
  );
}
