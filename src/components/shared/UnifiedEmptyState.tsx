import { Search, PackageOpen } from 'lucide-react';

interface UnifiedEmptyStateProps {
  title?: string;
  message?: string;
  variant?: 'search' | 'no-results' | 'idle';
}

export function UnifiedEmptyState({
  title,
  message,
  variant = 'idle',
}: UnifiedEmptyStateProps) {
  const Icon = variant === 'no-results' ? PackageOpen : Search;
  const defaultTitle = variant === 'no-results' ? 'No results found' : 'Ready to search';
  const defaultMessage =
    variant === 'no-results'
      ? 'Try adjusting your search or filters.'
      : 'Select from the dropdown or type a query to get started.';

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--om-bg-2)' }}
      >
        <Icon className="w-6 h-6" style={{ color: 'var(--om-text-3)' }} />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--om-text-0)' }}>
        {title || defaultTitle}
      </h3>
      <p className="text-sm max-w-md" style={{ color: 'var(--om-text-2)' }}>
        {message || defaultMessage}
      </p>
    </div>
  );
}
