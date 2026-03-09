import { useRef, useState, useCallback, type ReactNode, type TouchEvent } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  disabled?: boolean;
}

const THRESHOLD = 60;
const MAX_PULL = 100;

export function PullToRefresh({ onRefresh, children, disabled }: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || refreshing || window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [disabled, refreshing]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) { pulling.current = false; setPullDistance(0); return; }
    // Dampen the pull
    setPullDistance(Math.min(delta * 0.4, MAX_PULL));
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current && pullDistance === 0) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try { await onRefresh(); } catch { /* swallow */ }
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  if (!isMobile) return <>{children}</>;

  const pastThreshold = pullDistance >= THRESHOLD;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-20 transition-opacity duration-150"
        style={{
          top: pullDistance - 36,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: 'var(--om-bg-2)', border: '1px solid var(--om-border-0)' }}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--om-accent)' }} />
          ) : (
            <ArrowDown
              className="h-4 w-4 transition-transform duration-200"
              style={{
                color: pastThreshold ? 'var(--om-accent)' : 'var(--om-text-3)',
                transform: pastThreshold ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )}
        </div>
      </div>

      {/* Content shifted down during pull */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pulling.current ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
