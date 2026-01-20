import { Sparkles, Loader2, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GemScoreBreakdown } from "@/components/GemScoreBreakdown";
import type { GemScoreState } from "@/types/gemScore";

interface GemScoreBadgeProps {
  state: GemScoreState | undefined;
  className?: string;
}

export function GemScoreBadge({ state, className }: GemScoreBadgeProps) {
  if (!state) return null;
  
  const { loading, result } = state;
  
  if (loading) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md",
        "bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm",
        "text-xs font-medium text-muted-foreground",
        className
      )}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Gem: …</span>
      </div>
    );
  }
  
  if (!result || result.gemScore === null) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
            "bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm",
            "text-xs font-medium text-muted-foreground",
            "hover:bg-background transition-colors",
            className
          )}>
            <Sparkles className="h-3 w-3" />
            <span>Gem: —</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-auto p-3">
          <p className="text-sm text-muted-foreground">{result?.error || 'Unable to grade this listing'}</p>
        </PopoverContent>
      </Popover>
    );
  }
  
  // Certified grade - show special badge
  if (result.certifiedGrade) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
            "backdrop-blur-sm shadow-sm border",
            "text-xs font-medium",
            "hover:brightness-110 transition-all",
            "border-blue-500/30 bg-blue-500/10 text-blue-400",
            className
          )}>
            <Award className="h-3 w-3" />
            <span>{result.certifiedGrade.company} {result.certifiedGrade.grade}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-auto p-4">
          <GemScoreBreakdown result={result} />
        </PopoverContent>
      </Popover>
    );
  }
  
  const { gemScore, psa10Likelihood } = result;
  
  const likelihoodColors: Record<string, string> = {
    High: 'text-green-500',
    Medium: 'text-yellow-500',
    Low: 'text-muted-foreground'
  };
  
  const badgeColors: Record<string, string> = {
    High: 'border-green-500/30 bg-green-500/10',
    Medium: 'border-yellow-500/30 bg-yellow-500/10',
    Low: 'border-border/50 bg-background/90'
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
          "backdrop-blur-sm shadow-sm border",
          "text-xs font-medium",
          "hover:brightness-110 transition-all",
          badgeColors[psa10Likelihood],
          className
        )}>
          <Sparkles className={cn("h-3 w-3", likelihoodColors[psa10Likelihood])} />
          <span>
            Gem: {gemScore} | <span className={likelihoodColors[psa10Likelihood]}>{psa10Likelihood}</span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-auto p-4">
        <GemScoreBreakdown result={result} />
      </PopoverContent>
    </Popover>
  );
}
