import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';
import type { RoiCard as RoiCardType, RoiEbayListing } from '@/hooks/useRoiCards';
import { useRoiEbayListings } from '@/hooks/useRoiCards';

function fmt(val: number | null, prefix = '$'): string {
  if (val === null || val === undefined) return '—';
  const abs = Math.abs(val);
  const formatted = abs >= 1000
    ? abs.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return val < 0 ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
}

function GainBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null || value === undefined) return <span className="text-xs" style={{ color: 'var(--om-text-3)' }}>—</span>;
  const isPositive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
      {isPositive ? '+' : ''}{fmt(value)}
    </span>
  );
}

function ListingMini({ listing }: { listing: RoiEbayListing }) {
  return (
    <a
      href={listing.itemUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="om-card flex gap-2 p-2 hover:border-[var(--om-border-1)] transition-all group"
    >
      {listing.imageUrl && (
        <img src={listing.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium line-clamp-2" style={{ color: 'var(--om-text-1)' }}>{listing.title}</p>
        <p className="text-sm font-bold mt-1" style={{ color: 'var(--om-text-0)' }}>${listing.price}</p>
      </div>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity mt-1" style={{ color: 'var(--om-text-3)' }} />
    </a>
  );
}

export function RoiCard({ card }: { card: RoiCardType }) {
  const [expanded, setExpanded] = useState(false);
  const { data: listings, isLoading } = useRoiEbayListings(expanded ? card.card_name : null);

  return (
    <div className="om-card overflow-hidden">
      <div className="p-3 sm:p-4">
        {/* Title */}
        <h3 className="text-sm font-semibold line-clamp-2 leading-snug mb-3" style={{ color: 'var(--om-text-0)' }}>
          {card.card_name}
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <span style={{ color: 'var(--om-text-3)' }}>Raw Avg</span>
            <p className="font-semibold" style={{ color: 'var(--om-text-1)' }}>{fmt(card.raw_avg)}</p>
          </div>
          <div>
            <span style={{ color: 'var(--om-text-3)' }}>Multiplier</span>
            <p className="font-semibold" style={{ color: 'var(--om-text-1)' }}>
              {card.multiplier != null ? `${card.multiplier.toFixed(2)}x` : '—'}
            </p>
          </div>
          <div>
            <span style={{ color: 'var(--om-text-3)' }}>PSA 9</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold" style={{ color: 'var(--om-text-1)' }}>{fmt(card.psa9_avg)}</span>
              <GainBadge value={card.psa9_gain} label="gain" />
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--om-text-3)' }}>PSA 10</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold" style={{ color: 'var(--om-text-1)' }}>{fmt(card.psa10_avg)}</span>
              <GainBadge value={card.psa10_profit} label="profit" />
            </div>
          </div>
        </div>

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="om-btn mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors"
          style={{
            background: expanded ? 'rgba(10,132,255,0.12)' : 'var(--om-bg-3)',
            color: expanded ? 'var(--accent-blue)' : 'var(--om-text-2)',
            border: '1px solid var(--om-border-0)',
          }}
        >
          {expanded ? 'Hide' : 'View'} Listings
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded listings */}
      {expanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2" style={{ borderColor: 'var(--om-border-0)', background: 'var(--om-bg-0)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-xs" style={{ color: 'var(--om-text-3)' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching eBay...
            </div>
          ) : listings && listings.length > 0 ? (
            listings.map((listing) => (
              <ListingMini key={listing.itemId} listing={listing} />
            ))
          ) : (
            <p className="text-xs text-center py-4" style={{ color: 'var(--om-text-3)' }}>No active listings found</p>
          )}
        </div>
      )}
    </div>
  );
}
