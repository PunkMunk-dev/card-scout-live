import { useState, useRef, useEffect } from 'react';
import { Search, X, Star, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useScanner } from '@/hooks/useScannerState';

export function StickyScannerHeader() {
  const { state, dispatch, runSearch } = useScanner();
  const [input, setInput] = useState(state.query);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => { setInput(state.query); }, [state.query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (q) runSearch(q);
  };

  const handleClear = () => {
    setInput('');
    dispatch({ type: 'CLEAR_SEARCH' });
    inputRef.current?.focus();
  };

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{ background: 'var(--om-bg-1)', borderBottom: '1px solid var(--om-border-0)' }}
    >
      <div className="mx-auto w-full max-w-[1600px] px-3 md:px-4 flex h-11 items-center gap-3">
        {/* Brand */}
        <Link to="/" className="flex items-baseline gap-1 select-none shrink-0">
          <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--om-text-0)' }}>
            OmniMarket
          </span>
          <span className="text-[9px] tracking-[0.28em] uppercase" style={{ color: 'var(--om-text-3)' }}>
            Cards
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 max-w-2xl">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
              style={{ color: 'var(--om-text-3)' }}
            />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search cards, players, sets, parallels, teams, characters…"
              className="flex h-8 w-full rounded-lg pl-9 pr-8 text-xs om-input"
            />
            {input && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--om-bg-3)]"
              >
                <X className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} />
              </button>
            )}
          </div>
        </form>

        {/* Mode toggle + Utility */}
        <div className="flex items-center gap-1 shrink-0">
          <div
            className="flex h-7 rounded-md overflow-hidden text-[11px] font-medium"
            style={{ border: '1px solid var(--om-border-0)' }}
          >
            <button
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'scanner' })}
              className="px-2.5 transition-colors"
              style={{
                background: state.viewMode === 'scanner' ? 'var(--om-bg-3)' : 'transparent',
                color: state.viewMode === 'scanner' ? 'var(--om-text-0)' : 'var(--om-text-3)',
              }}
            >
              Scanner
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'rawToPsa' })}
              className="px-2.5 transition-colors"
              style={{
                background: state.viewMode === 'rawToPsa' ? 'var(--om-bg-3)' : 'transparent',
                color: state.viewMode === 'rawToPsa' ? 'var(--om-text-0)' : 'var(--om-text-3)',
                borderLeft: '1px solid var(--om-border-0)',
              }}
            >
              Raw → PSA 10
            </button>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--om-bg-2)]"
            style={{ color: 'var(--om-text-2)' }}
            title="Watchlist"
          >
            <Star className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--om-bg-2)]"
            style={{ color: 'var(--om-text-2)' }}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
