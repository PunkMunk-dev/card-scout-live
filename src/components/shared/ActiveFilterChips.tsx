import { X } from 'lucide-react';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: FilterChip[];
  onClearAll?: () => void;
}

export function ActiveFilterChips({ chips, onClearAll }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-3 animate-fadeIn">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 om-pill om-pill-active text-[11px] pr-1"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {onClearAll && chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors hover:bg-muted"
          style={{ color: 'var(--om-text-2)' }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
