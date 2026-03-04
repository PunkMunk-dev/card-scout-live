import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnifiedErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function UnifiedErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: UnifiedErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--om-bg-2)' }}
      >
        <AlertTriangle className="w-6 h-6" style={{ color: 'var(--om-danger)' }} />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--om-text-0)' }}>
        Error
      </h3>
      <p className="text-sm max-w-md mb-4" style={{ color: 'var(--om-text-2)' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="om-btn">
          Retry
        </Button>
      )}
    </div>
  );
}
