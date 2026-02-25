import { Search } from 'lucide-react';

export function GuidedSearchEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--om-bg-2)' }}>
        <Search className="w-6 h-6" style={{ color: 'var(--om-text-3)' }} />
      </div>
      <p className="text-sm max-w-md" style={{ color: 'var(--om-text-2)' }}>
        Select from dropdown for guided search
      </p>
    </div>
  );
}
