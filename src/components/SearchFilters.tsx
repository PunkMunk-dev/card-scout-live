import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SortOption, BuyingOption } from "@/types/ebay";

interface SearchFiltersProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  buyingOption: BuyingOption;
  onBuyingOptionChange: (option: BuyingOption) => void;
  includeLots: boolean;
  onIncludeLotsChange: (include: boolean) => void;
}

export function SearchFilters({
  sort,
  onSortChange,
  buyingOption,
  onBuyingOptionChange,
  includeLots,
  onIncludeLotsChange,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 py-4">
      <div className="flex items-center gap-3">
        <Label htmlFor="sort" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Sort by
        </Label>
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger id="sort" className="w-44 bg-card border-border hover:border-[hsl(var(--border-hover))] transition-colors duration-150">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="best">Best Match</SelectItem>
            <SelectItem value="price_asc">Lowest Price</SelectItem>
            <SelectItem value="end_soonest">Ending Soon</SelectItem>
            <SelectItem value="newly_listed">Newly Listed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium text-muted-foreground">
          Buying Format
        </Label>
        <ToggleGroup 
          type="single" 
          value={buyingOption} 
          onValueChange={(v) => v && onBuyingOptionChange(v as BuyingOption)}
          className="bg-secondary p-1 rounded-xl"
        >
          <ToggleGroupItem 
            value="ALL" 
            className="px-4 py-2 text-sm rounded-lg data-[state=on]:bg-card data-[state=on]:shadow-sm transition-all duration-150"
          >
            All
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="AUCTION" 
            className="px-4 py-2 text-sm rounded-lg data-[state=on]:bg-card data-[state=on]:shadow-sm transition-all duration-150"
          >
            Auction
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="FIXED_PRICE" 
            className="px-4 py-2 text-sm rounded-lg data-[state=on]:bg-card data-[state=on]:shadow-sm transition-all duration-150"
          >
            Buy It Now
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Switch
          id="include-lots"
          checked={includeLots}
          onCheckedChange={onIncludeLotsChange}
          className="data-[state=checked]:bg-primary"
        />
        <Label htmlFor="include-lots" className="text-sm font-medium cursor-pointer text-foreground">
          Include lots/boxes
        </Label>
      </div>
    </div>
  );
}