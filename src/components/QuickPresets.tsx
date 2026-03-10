import { Zap } from 'lucide-react';

interface QuickPresetsProps {
  onSelect: (query: string) => void;
}

const PRESETS = [
  { label: 'Pokémon Alt Arts', query: 'pokemon alt art' },
  { label: 'One Piece Raw', query: 'one piece raw' },
  { label: 'NBA Rookies', query: 'nba rookie card' },
  { label: 'NFL QBs', query: 'nfl quarterback card' },
  { label: 'Ending Soon', query: 'trading card ending soon' },
  { label: 'Charizard', query: 'charizard' },
];

export function QuickPresets({ onSelect }: QuickPresetsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Zap className="h-3 w-3 shrink-0" style={{ color: 'var(--om-accent)' }} />
      {PRESETS.map(p => (
        <button
          key={p.label}
          onClick={() => onSelect(p.query)}
          className="px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors hover:bg-[rgba(10,132,255,0.12)]"
          style={{ background: 'var(--om-bg-2)', color: 'var(--om-text-1)', border: '1px solid var(--om-border-0)' }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
