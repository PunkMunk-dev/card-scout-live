interface ResultsHeaderProps {
  query: string;
  total: number;
  showing: number;
}

export function ResultsHeader({ query, total, showing }: ResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/50">
      <div>
        <h2 className="text-lg font-semibold font-display">
          Results for "<span className="text-primary">{query}</span>"
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Showing {showing.toLocaleString()} of {total.toLocaleString()} listings
        </p>
      </div>
    </div>
  );
}
