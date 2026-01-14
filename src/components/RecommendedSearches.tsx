import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PlayerRecommendation } from "@/data/playerRecommendations";

interface RecommendedSearchesProps {
  recommendation: PlayerRecommendation;
  onSearchClick: (searchQuery: string) => void;
}

const sportColors: Record<string, string> = {
  baseball: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  football: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  basketball: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  hockey: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  wnba: "bg-violet-500/10 text-violet-500 border-violet-500/20",
};

const sportLabels: Record<string, string> = {
  baseball: "⚾ Baseball",
  football: "🏈 Football",
  basketball: "🏀 Basketball",
  hockey: "🏒 Hockey",
  wnba: "🏀 WNBA",
};

export function RecommendedSearches({ recommendation, onSearchClick }: RecommendedSearchesProps) {
  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Recommended High-Value Searches
        </h3>
        <Badge 
          variant="outline" 
          className={`ml-auto text-xs ${sportColors[recommendation.sport]}`}
        >
          {sportLabels[recommendation.sport]}
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3">
        Top search combinations for <span className="font-medium text-foreground">{recommendation.player}</span> based on collector demand
      </p>
      
      <div className="flex flex-wrap gap-2">
        {recommendation.searches.map((search, index) => (
          <button
            key={index}
            onClick={() => onSearchClick(search)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full 
                       bg-primary/10 text-primary border border-primary/20
                       hover:bg-primary/20 hover:border-primary/30
                       transition-colors duration-200 cursor-pointer"
          >
            {search}
          </button>
        ))}
      </div>
    </div>
  );
}
