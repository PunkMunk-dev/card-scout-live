import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

const MAX_LENGTH = 200;

export const QuickSearchInput = forwardRef<HTMLDivElement, QuickSearchInputProps>(
  function QuickSearchInput({ value, onChange, placeholder = "Search any card, e.g. 'Mike Trout topps chrome refractor'", className, debounceMs = 600 }, ref) {
    const [localValue, setLocalValue] = useState(value);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => { setLocalValue(value); }, [value]);

    const debouncedOnChange = useCallback((newValue: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(newValue), debounceMs);
    }, [onChange, debounceMs]);

    useEffect(() => { return () => { if (debounceRef.current) clearTimeout(debounceRef.current); }; }, []);

    return (
      <div ref={ref} className={cn("relative flex-1", className)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input type="text" value={localValue}
          onChange={(e) => { const v = e.target.value.slice(0, MAX_LENGTH); setLocalValue(v); debouncedOnChange(v); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { if (debounceRef.current) clearTimeout(debounceRef.current); onChange(localValue); } }}
          placeholder={placeholder} className="pl-9 pr-9 h-10" maxLength={MAX_LENGTH} />
        {localValue && (
          <Button type="button" variant="ghost" size="sm"
            onClick={() => { setLocalValue(''); if (debounceRef.current) clearTimeout(debounceRef.current); onChange(''); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }
);
