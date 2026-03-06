import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountdown } from '@/hooks/useCountdown';

interface AuctionCountdownBadgeProps {
  endDate?: string;
  timeRemaining?: string;
}

export function AuctionCountdownBadge({ endDate, timeRemaining }: AuctionCountdownBadgeProps) {
  const countdown = useCountdown(endDate);

  let label: string | null = null;
  let isUrgent = false;
  let isWarning = false;

  if (countdown && !countdown.isEnded) {
    const { days, hours, minutes, seconds } = countdown;
    isUrgent = countdown.isUrgent;
    isWarning = countdown.isWarning;
    if (days > 0) label = `${days}d ${hours}h`;
    else if (hours > 0) label = `${hours}h ${minutes}m`;
    else if (minutes > 0) label = `${minutes}m ${seconds}s`;
    else label = `${seconds}s`;
  } else if (!endDate && timeRemaining) {
    label = timeRemaining;
    // Parse static string for urgency heuristic
    const match = timeRemaining.match(/^(\d+)m$/);
    if (match && parseInt(match[1]) < 15) isUrgent = true;
    else if (match && parseInt(match[1]) < 60) isWarning = true;
  }

  if (!label) return null;

  return (
    <div
      className={cn(
        "absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums backdrop-blur-md",
        isUrgent
          ? "bg-destructive/80 text-destructive-foreground shadow-[0_4px_12px_rgba(255,0,0,0.35)] animate-pulse"
          : isWarning
          ? "bg-orange-500/80 text-white shadow-[0_4px_12px_rgba(255,165,0,0.25)]"
          : "bg-black/60 text-white/90"
      )}
    >
      <Clock className="h-2.5 w-2.5 flex-shrink-0" />
      {label}
    </div>
  );
}
