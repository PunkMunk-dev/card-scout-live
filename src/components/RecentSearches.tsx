import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';

const RECENT_SEARCHES_KEY = 'omni_recent_searches_v1';

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch { return []; }
}

function removeRecentSearch(term: string) {
  try {
    const existing = getRecentSearches();
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(existing.filter(x => x !== term)));
  } catch {}
}

interface RecentSearchesProps {
  onSelect: (term: string) => void;
  maxItems?: number;
}

export function RecentSearches({ onSelect, maxItems = 8 }: RecentSearchesProps) {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    setSearches(getRecentSearches().slice(0, maxItems));
  }, [maxItems]);

  const handleRemove = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentSearch(term);
    setSearches(prev => prev.filter(x => x !== term));
  };

  if (searches.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Clock className="h-3 w-3 shrink-0" style={{ color: 'var(--om-text-3)' }} />
      {searches.map(term => (
        <button
          key={term}
          onClick={() => onSelect(term)}
          className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors hover:bg-[var(--om-bg-3)]"
          style={{ background: 'var(--om-bg-2)', color: 'var(--om-text-2)', border: '1px solid var(--om-border-0)' }}
        >
          <span className="truncate max-w-[120px]">{term}</span>
          <X
            className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            style={{ color: 'var(--om-text-3)' }}
            onClick={(e) => handleRemove(term, e)}
          />
        </button>
      ))}
    </div>
  );
}
