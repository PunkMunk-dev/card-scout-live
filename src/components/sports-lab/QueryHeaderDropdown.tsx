import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface DropdownOption { id: string; label: string; note?: string; }

interface QueryHeaderDropdownProps {
  label: string; value: string; placeholder: string; options: DropdownOption[];
  selectedId: string | null; onSelect: (id: string) => void; searchable?: boolean;
  showAllMode?: boolean; showAllActive?: boolean; onShowAll?: () => void;
}

export function QueryHeaderDropdown({ label, value, placeholder, options, selectedId, onSelect, searchable = false, showAllMode = false, showAllActive = false, onShowAll }: QueryHeaderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setIsOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = searchable && search ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())) : options;

  return (
    <div ref={containerRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)}
        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
          "bg-secondary/50 hover:bg-secondary border-border/50",
          isOpen && "border-primary/40 ring-1 ring-primary/20",
          (selectedId || showAllActive) ? "text-foreground" : "text-muted-foreground")}>
        {label && <span className="text-xs text-muted-foreground mr-1">{label}</span>}
        <span className="truncate max-w-[100px]">{value || placeholder}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[260px] max-w-[320px] bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-2.5 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder={`Search ${label.toLowerCase() || 'options'}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" autoFocus />
              </div>
            </div>
          )}
          <div className="max-h-[300px] overflow-y-auto p-1.5">
            {showAllMode && (
              <button onClick={() => { onShowAll?.(); setIsOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-left hover:bg-accent/50", showAllActive && "bg-primary/10 text-primary")}>
                <Layers className="h-4 w-4" /><span className="font-medium">All Brands</span>
                {showAllActive && <Check className="h-4 w-4 ml-auto" />}
              </button>
            )}
            {filtered.length === 0 ? <div className="px-3 py-6 text-center text-sm text-muted-foreground">No results</div> :
              filtered.map(o => {
                const sel = !showAllActive && o.id === selectedId;
                return (
                  <button key={o.id} onClick={() => { onSelect(o.id); setIsOpen(false); setSearch(''); }}
                    className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm text-left hover:bg-accent/50", sel && "bg-primary/10 text-primary")}>
                    <div className="flex-1 min-w-0">
                      <span className={cn("font-medium", sel && "text-primary")}>{o.label}</span>
                      {o.note && <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{o.note}</p>}
                    </div>
                    {sel && <Check className="h-4 w-4 flex-shrink-0 ml-2" />}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

interface TraitsDropdownProps { traits: DropdownOption[]; selectedIds: string[]; onToggle: (id: string) => void; onClear?: () => void; }

export function TraitsDropdown({ traits, selectedIds, onToggle, onClear }: TraitsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const count = selectedIds.length;
  const labels = traits.filter(t => selectedIds.includes(t.id)).map(t => t.label);
  const display = count === 0 ? '' : count <= 2 ? labels.join(' · ') : `${count} traits`;

  return (
    <div ref={containerRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)}
        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
          "bg-secondary/50 hover:bg-secondary border-border/50", isOpen && "border-primary/40 ring-1 ring-primary/20",
          count > 0 ? "text-foreground" : "text-muted-foreground")}>
        <span className="text-xs text-muted-foreground mr-1">Traits</span>
        <span className="truncate max-w-[80px]">{display || 'Any'}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[240px] bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          <div className="p-3">
            <p className="text-[11px] text-muted-foreground/70 mb-2.5">Select multiple traits</p>
            <div className="grid grid-cols-2 gap-2">
              {traits.map(t => {
                const sel = selectedIds.includes(t.id);
                return (
                  <button key={t.id} onClick={() => onToggle(t.id)}
                    className={cn("flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all",
                      sel ? "bg-primary text-primary-foreground border-primary" : "bg-background/50 border-border hover:border-primary/50")}>
                    {sel && <Check className="h-3 w-3 flex-shrink-0" />}
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {count > 0 && (
            <div className="border-t border-border px-3 py-2.5 bg-background/30 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/70 truncate max-w-[160px]">{labels.join(' · ')}</span>
              <button onClick={() => onClear ? onClear() : selectedIds.forEach(id => onToggle(id))} className="text-[11px] text-muted-foreground hover:text-foreground">Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
