import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import type { SortOption, BuyingOption } from "@/types/ebay";

interface SearchFiltersProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  buyingOption: BuyingOption;
  onBuyingOptionChange: (option: BuyingOption) => void;
  includeLots: boolean;
  onIncludeLotsChange: (include: boolean) => void;
  gemScoreEnabled?: boolean;
  onGemScoreChange?: (enabled: boolean) => void;
  isGemScoreConfigured?: boolean;
}

export function SearchFilters({
  sort,
  onSortChange,
  buyingOption,
  onBuyingOptionChange,
  includeLots,
  onIncludeLotsChange,
  gemScoreEnabled = false,
  onGemScoreChange,
  isGemScoreConfigured = false,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 py-4">
      <div className="flex items-center gap-3">
        <Label htmlFor="sort" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Sort by
        </Label>
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger id="sort" className="w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {buyingOption === "ALL" && (
              <>
                <SelectItem value="best">Best Match</SelectItem>
                <SelectItem value="price_asc">Lowest Price</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
              </>
            )}
            {buyingOption === "AUCTION" && (
              <>
                <SelectItem value="raw">Raw Cards</SelectItem>
                <SelectItem value="graded">Graded Cards</SelectItem>
              </>
            )}
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
          className="bg-secondary/50 p-1 rounded-lg"
        >
          <ToggleGroupItem 
            value="ALL" 
            className="px-4 py-2 text-sm data-[state=on]:bg-card data-[state=on]:shadow-sm rounded-md"
          >
            All
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="AUCTION" 
            className="px-4 py-2 text-sm data-[state=on]:bg-card data-[state=on]:shadow-sm rounded-md"
          >
            Auction
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Switch
                  id="gem-score"
                  checked={gemScoreEnabled}
                  onCheckedChange={onGemScoreChange}
                  disabled={!isGemScoreConfigured}
                />
                <Label 
                  htmlFor="gem-score" 
                  className={`text-sm font-medium cursor-pointer flex items-center gap-1.5 ${
                    !isGemScoreConfigured ? 'text-muted-foreground/50' : ''
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Gem Score
                </Label>
              </div>
            </TooltipTrigger>
            {!isGemScoreConfigured && (
              <TooltipContent>
                <p>Gem Score requires VITE_XIMILAR_API_TOKEN to be configured</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <div className="w-px h-5 bg-border/50" />

        <Switch
          id="include-lots"
          checked={includeLots}
          onCheckedChange={onIncludeLotsChange}
        />
        <Label htmlFor="include-lots" className="text-sm font-medium cursor-pointer">
          Include lots/boxes
        </Label>
      </div>
    </div>
  );
}
