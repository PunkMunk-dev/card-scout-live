const MARKETPLACES = ['Amazon', 'eBay', 'Etsy', 'StockX', 'Mercari', 'Walmart'];

export function MarketplaceBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {MARKETPLACES.map((name, i) => (
        <span
          key={name}
          className="text-xs font-medium tracking-wide uppercase"
          style={{ color: 'var(--om-text-3)', letterSpacing: '0.08em' }}
        >
          {name}
        </span>
      ))}
    </div>
  );
}
