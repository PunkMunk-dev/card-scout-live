import { useState } from 'react';
import { ExternalLink, ImageOff, Clock, Star, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountdown } from '@/hooks/useCountdown';
import { useSharedWatchlist } from '@/contexts/WatchlistContext';
import { roiAuctionToEbayItem } from '@/lib/watchlistAdapters';
import type { RoiCard } from '@/hooks/useRoiCards';
import type { LiveRoiAuction } from '@/hooks/useLiveRoiAuctions';

interface LiveAuctionCardProps {
  card: RoiCard;
  live: LiveRoiAuction;
}

function fmt(val: number | null, prefix = '$'): string {
  if (val == null) return '—';
  return `${prefix}${val.toFixed(val < 100 ? 2 : 0)}`;
}

function CountdownLabel({ endDate }: { endDate: string }) {
  const cd = useCountdown(endDate);
  if (!cd) return null;

  if (cd.isEnded) {
    return (
      <span className="text-[10px] font-mono" style={{ color: 'var(--om-text-3)' }}>
        Ended
      </span>
    );
  }

  let label: string;
  if (cd.days > 0) {
    label = `${cd.days}d ${cd.hours}h`;
  } else if (cd.hours > 0) {
    label = `${cd.hours}h ${cd.minutes}m`;
  } else {
    label = `${cd.minutes}m ${cd.seconds}s`;
  }

  const colorVar = cd.isUrgent
    ? 'var(--om-danger)'
    : cd.isWarning
      ? 'var(--om-warning, #f59e0b)'
      : 'var(--om-text-2)';

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold"
      style={{ color: colorVar }}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}

export function LiveAuctionCard({ card, live }: LiveAuctionCardProps) {
  const [copied, setCopied] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useSharedWatchlist();

  const ebayItem = roiAuctionToEbayItem(card, live);
  const watched = isInWatchlist(ebayItem.itemId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(card.card_name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      className="om-card rounded-2xl overflow-hidden flex flex-col group"
      style={{ border: '1px solid var(--om-border-0)' }}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] w-full overflow-hidden relative" style={{ background: 'var(--om-surface-1)' }}>
        {live.image_url ? (
          <img
            src={live.image_url}
            alt={card.card_name}
            className="h-full w-full object-contain"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
              const el = document.createElement('div');
              el.className = 'flex items-center justify-center';
              el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--om-text-3);opacity:0.4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
              e.currentTarget.parentElement?.appendChild(el);
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImageOff className="h-6 w-6 opacity-30" style={{ color: 'var(--om-text-3)' }} />
          </div>
        )}

        {/* Watchlist star */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWatchlist(ebayItem);
          }}
          className={cn(
            "absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors",
            watched ? "text-[var(--om-accent)]" : "text-white/70 hover:text-white"
          )}
          aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Star className={cn("h-3.5 w-3.5", watched && "fill-current")} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Name */}
        <h3 className="text-xs font-semibold line-clamp-2 leading-snug" style={{ color: 'var(--om-text-0)' }}>
          {card.card_name}
        </h3>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
          <div>
            <span style={{ color: 'var(--om-text-3)' }}>Bid</span>
            <div style={{ color: 'var(--om-text-0)' }}>{fmt(live.current_bid)}</div>
          </div>
          <div>
            <span style={{ color: 'var(--om-text-3)' }}>Multiplier</span>
            <div style={{ color: 'var(--om-text-0)' }}>
              {card.multiplier != null ? `${card.multiplier.toFixed(1)}×` : '—'}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="mt-auto pt-1">
          {live.end_time ? (
            <CountdownLabel endDate={live.end_time} />
          ) : (
            <span className="text-[10px] font-mono" style={{ color: 'var(--om-text-3)' }}>
              End time unknown
            </span>
          )}
        </div>

        {/* CTA row */}
        <div className="mt-1 flex items-center gap-1.5">
          <a
            href={live.listing_url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-colors"
            style={{
              background: 'var(--om-accent)',
              color: 'var(--om-accent-fg, #fff)',
            }}
          >
            Open on eBay
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={handleCopy}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ border: '1px solid var(--om-border-0)', color: 'var(--om-text-2)' }}
            aria-label="Copy title"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
