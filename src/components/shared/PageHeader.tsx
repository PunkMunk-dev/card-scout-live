interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export function PageHeader({ title, subtitle, rightSlot }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1
          className="text-xl md:text-2xl font-bold tracking-tight"
          style={{ color: 'var(--om-text-0)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: 'var(--om-text-2)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {rightSlot && <div className="shrink-0 flex items-center gap-2">{rightSlot}</div>}
    </div>
  );
}
