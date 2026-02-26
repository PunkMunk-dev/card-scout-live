import { cn } from '@/lib/utils';

export type SearchMode = 'guided' | 'quick';

interface SearchModeToggleProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  className?: string;
}

export function SearchModeToggle({ mode, onModeChange, className }: SearchModeToggleProps) {
  return (
    <div className={cn("inline-flex items-center rounded-full p-1", className)} style={{ background: 'var(--om-bg-2)' }} role="tablist">
      <button role="tab" aria-selected={mode === 'guided'} onClick={() => onModeChange('guided')}
        className={cn("relative px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200",
          mode === 'guided' ? "text-white shadow-[0_6px_20px_rgba(10,132,255,0.35)]" : "hover:opacity-80")}
        style={mode === 'guided' ? { background: 'var(--accent-blue)' } : { color: 'var(--om-text-2)' }}>
        Guided
      </button>
      <button role="tab" aria-selected={mode === 'quick'} onClick={() => onModeChange('quick')}
        className={cn("relative px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200",
          mode === 'quick' ? "text-white shadow-[0_6px_20px_rgba(10,132,255,0.35)]" : "hover:opacity-80")}
        style={mode === 'quick' ? { background: 'var(--accent-blue)' } : { color: 'var(--om-text-2)' }}>
        Quick Search
      </button>
    </div>
  );
}
