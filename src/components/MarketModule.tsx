import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface MarketModuleProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  headerRight?: ReactNode;
}

export function MarketModule({ title, subtitle, children, defaultExpanded = true, headerRight }: MarketModuleProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--om-bg-1)', border: '1px solid var(--om-border-0)' }}
    >
      {/* Module header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--om-bg-2)] transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--om-text-3)' }} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--om-text-3)' }} />
          )}
          <h2
            className="text-sm font-semibold tracking-tight truncate"
            style={{ color: 'var(--om-text-0)', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {title}
          </h2>
          {subtitle && (
            <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--om-text-3)' }}>
              {subtitle}
            </span>
          )}
        </div>
        {headerRight && (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {headerRight}
          </div>
        )}
      </button>

      {/* Module content */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--om-border-0)' }}>
          {children}
        </div>
      )}
    </section>
  );
}
