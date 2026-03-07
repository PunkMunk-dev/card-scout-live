import { Search, PackageOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnifiedEmptyStateProps {
  title?: string;
  message?: string;
  variant?: 'search' | 'no-results' | 'idle' | 'rate-limited';
  onRetry?: () => void;
}

export function UnifiedEmptyState({
  title,
  message,
  variant = 'idle',
  onRetry,
}: UnifiedEmptyStateProps) {
  const Icon = variant === 'no-results' ? PackageOpen : variant === 'rate-limited' ? Clock : Search;
  const defaultTitle =
    variant === 'no-results' ? 'No results found'
    : variant === 'rate-limited' ? 'eBay rate limit reached'
    : 'Ready to search';
  const defaultMessage =
    variant === 'no-results'
      ? 'Try adjusting your search or filters.'
      : variant === 'rate-limited'
        ? 'Too many requests to eBay. Please wait 30–60 seconds and try again.'
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
      {variant === 'rate-limited' && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          Retry
        </Button>
      )}
    </div>
  );
}
