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
    <div className="flex flex-wrap items-center gap-4 py-2.5 border-b border-border/30">
      <div className="flex items-center gap-2">
        <Label htmlFor="sort" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Sort
        </Label>
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger id="sort" className="h-8 w-36 text-xs bg-card border-border hover:border-[hsl(var(--border-hover))] transition-colors duration-150">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="best" className="text-xs">Best Match</SelectItem>
            <SelectItem value="price_asc" className="text-xs">Lowest Price</SelectItem>
            <SelectItem value="end_soonest" className="text-xs">Ending Soon</SelectItem>
            <SelectItem value="newly_listed" className="text-xs">Newly Listed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Format
        </Label>
        <ToggleGroup 
          type="single" 
          value={buyingOption} 
          onValueChange={(v) => v && onBuyingOptionChange(v as BuyingOption)}
          className="bg-secondary p-0.5 rounded-lg"
        >
          <ToggleGroupItem 
            value="ALL" 
            className="px-2.5 py-1 text-xs rounded-md data-[state=on]:bg-card data-[state=on]:shadow-sm transition-all duration-150"
          >
            All
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="AUCTION" 
            className="px-2.5 py-1 text-xs rounded-md data-[state=on]:bg-card data-[state=on]:shadow-sm transition-all duration-150"
          >
            Auction
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="FIXED_PRICE" 
            className="px-2.5 py-1 text-xs rounded-md data-[state=on]:bg-card data-[state=on]:shadow-sm transition-all duration-150"
          >
            Buy Now
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Switch
          id="include-lots"
          checked={includeLots}
          onCheckedChange={onIncludeLotsChange}
          className="data-[state=checked]:bg-primary scale-90"
        />
        <Label htmlFor="include-lots" className="text-xs font-medium cursor-pointer text-foreground">
          Include lots
        </Label>
      </div>
    </div>
  );
}