import { ChevronRight, Bookmark, X, Trash2 } from 'lucide-react';
import { useScanner } from '@/hooks/useScannerState';
import { SCANNER_PRESETS, buildPresetFilters } from '@/lib/scannerPresets';
import { cn } from '@/lib/utils';

export function ScannerSidebar() {
  const { state, dispatch, runSearch } = useScanner();
  const { sidebarOpen, recentQueries, savedSearches } = state;

  if (!sidebarOpen) return null;

  const handlePreset = (preset: typeof SCANNER_PRESETS[0]) => {
    const f = buildPresetFilters(preset);
    if (preset.query) {
      runSearch(preset.query, 1, f, preset.sortBy);
    } else {
      dispatch({ type: 'UPDATE_FILTERS', filters: f });
      dispatch({ type: 'SET_SORT', sortBy: preset.sortBy });
    }
  };

  const handleRecent = (q: string) => runSearch(q);

  const handleRemoveSaved = (id: string) => {
    dispatch({ type: 'REMOVE_SAVED', id });
  };

  const tcgPresets = SCANNER_PRESETS.filter(p => p.group === 'tcg');
  const sportsPresets = SCANNER_PRESETS.filter(p => p.group === 'sports');
  const universalPresets = SCANNER_PRESETS.filter(p => p.group === 'universal');

  return (
    <aside
      className="w-56 shrink-0 overflow-y-auto border-r"
      style={{
        background: 'var(--om-bg-1)',
        borderColor: 'var(--om-border-0)',
        height: 'calc(100vh - 72px)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--om-border-0)' }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--om-text-3)' }}>
          Scanner
        </span>
        <button onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} className="p-1 rounded hover:bg-[var(--om-bg-2)]">
          <X className="h-3.5 w-3.5" style={{ color: 'var(--om-text-3)' }} />
        </button>
      </div>

      {/* Recent */}
      {recentQueries.length > 0 && (
        <Section title="Recent">
          {recentQueries.slice(0, 8).map(q => (
            <SidebarItem key={q} label={q} onClick={() => handleRecent(q)} />
          ))}
        </Section>
      )}

      {/* Saved */}
      {savedSearches.length > 0 && (
        <Section title="Saved Searches">
          {savedSearches.map(s => (
            <div key={s.id} className="flex items-center group">
              <SidebarItem label={s.name} icon={<Bookmark className="h-3 w-3" />} onClick={() => runSearch(s.query, 1, s.filters)} className="flex-1" />
              <button onClick={() => handleRemoveSaved(s.id)} className="opacity-0 group-hover:opacity-100 p-1 mr-1 rounded hover:bg-[var(--om-bg-3)]">
                <Trash2 className="h-3 w-3" style={{ color: 'var(--om-danger)' }} />
              </button>
            </div>
          ))}
        </Section>
      )}

      {/* TCG Presets */}
      <Section title="TCG">
        {tcgPresets.map(p => (
          <SidebarItem key={p.id} label={p.name} onClick={() => handlePreset(p)} />
        ))}
      </Section>

      {/* Sports Presets */}
      <Section title="Sports">
        {sportsPresets.map(p => (
          <SidebarItem key={p.id} label={p.name} onClick={() => handlePreset(p)} />
        ))}
      </Section>

      {/* Universal */}
      <Section title="Quick Filters">
        {universalPresets.map(p => (
          <SidebarItem key={p.id} label={p.name} onClick={() => handlePreset(p)} />
        ))}
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid var(--om-border-0)' }}>
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--om-text-3)' }}>
          {title}
        </span>
      </div>
      <div className="pb-2">{children}</div>
    </div>
  );
}

function SidebarItem({
  label, icon, onClick, className,
}: { label: string; icon?: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors hover:bg-[var(--om-bg-2)]',
        className,
      )}
      style={{ color: 'var(--om-text-1)' }}
    >
      {icon || <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--om-text-3)' }} />}
      <span className="truncate">{label}</span>
    </button>
  );
}
