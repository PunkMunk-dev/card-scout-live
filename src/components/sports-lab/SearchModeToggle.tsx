import { cn } from '@/lib/utils';

export type SearchMode = 'guided' | 'quick';

interface SearchModeToggleProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  className?: string;
}

export function SearchModeToggle({ mode, onModeChange, className }: SearchModeToggleProps) {
  return (
    <div className={cn("inline-flex items-center rounded-full bg-secondary p-0.5", className)} role="tablist">
      <button role="tab" aria-selected={mode === 'guided'} onClick={() => onModeChange('guided')}
        className={cn("relative px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200", mode === 'guided' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/80")}>
        Guided
      </button>
      <button role="tab" aria-selected={mode === 'quick'} onClick={() => onModeChange('quick')}
        className={cn("relative px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200", mode === 'quick' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/80")}>
        Quick Search
      </button>
    </div>
  );
}
