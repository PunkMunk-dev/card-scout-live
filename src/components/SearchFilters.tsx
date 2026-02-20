import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { SortOption } from "@/types/ebay";

interface SearchFiltersProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function SearchFilters({ sort, onSortChange }: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 py-4">
      <div className="flex items-center gap-3">
        <Label htmlFor="sort" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Sort by
        </Label>
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger id="sort" className="w-48 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="best">Best Match</SelectItem>
            <SelectItem value="price_asc">Price: Low-High</SelectItem>
            <SelectItem value="auction_only">Auction</SelectItem>
            <SelectItem value="buy_now_only">Buy It Now</SelectItem>
            <SelectItem value="raw">Ungraded</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
