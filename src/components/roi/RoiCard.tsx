import type { RoiCard as RoiCardType } from '@/hooks/useRoiCards';
import { useRoiEbayListings } from '@/hooks/useRoiCards';

function fmt(val: number | null, prefix = '$'): string {
  if (val === null || val === undefined) return '—';
  const abs = Math.abs(val);
  const formatted = abs >= 1000
    ? abs.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return val < 0 ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
}

function GainBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-[10px]" style={{ color: 'var(--om-text-3)' }}>—</span>;
  const isPositive = value >= 0;
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded ${isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
      {isPositive ? '+' : ''}{fmt(value)}
    </span>
  );
}

export function RoiCard({ card }: { card: RoiCardType }) {
  const { data: listings, isLoading } = useRoiEbayListings(card.card_name);
  const firstListing = listings?.[0];
  const imageUrl = firstListing?.imageUrl;
  const linkUrl = firstListing?.itemUrl;

  const cardContent = (
    <div className="om-card overflow-hidden group relative">
      {/* Image area */}
      <div className="aspect-[4/3] w-full overflow-hidden" style={{ background: 'var(--om-bg-2)' }}>
        {isLoading ? (
          <div className="w-full h-full animate-pulse" style={{ background: 'var(--om-bg-3)' }} />
        ) : imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--om-bg-3)' }}>
            <span className="text-xs font-mono" style={{ color: 'var(--om-text-3)' }}>No image</span>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3">
        <h3 className="text-xs font-semibold line-clamp-2 leading-snug mb-2 font-mono" style={{ color: 'var(--om-text-0)' }}>
          {card.card_name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono" style={{ color: 'var(--om-text-3)' }}>
            Raw <span className="font-semibold" style={{ color: 'var(--om-text-1)' }}>{fmt(card.raw_avg)}</span>
          </span>
          <GainBadge value={card.psa10_profit} />
        </div>
      </div>

      {/* Hover overlay — full stats */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}
      >
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-mono">
          <div>
            <span className="text-white/50">PSA 9</span>
            <div className="flex items-center gap-1">
              <span className="text-white/90 font-semibold">{fmt(card.psa9_avg)}</span>
              <GainBadge value={card.psa9_gain} />
            </div>
          </div>
          <div>
            <span className="text-white/50">PSA 10</span>
            <div className="flex items-center gap-1">
              <span className="text-white/90 font-semibold">{fmt(card.psa10_avg)}</span>
              <GainBadge value={card.psa10_profit} />
            </div>
          </div>
          <div>
            <span className="text-white/50">Raw</span>
            <p className="text-white/90 font-semibold">{fmt(card.raw_avg)}</p>
          </div>
          <div>
            <span className="text-white/50">Multiplier</span>
            <p className="text-white/90 font-semibold">
              {card.multiplier != null ? `${card.multiplier.toFixed(2)}x` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (linkUrl) {
    return (
      <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="block">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}
