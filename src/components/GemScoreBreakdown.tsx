import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Database, Sparkles, Info, AlertTriangle, Image } from "lucide-react";
import type { GemScoreResult } from "@/types/gemScore";

interface GemScoreBreakdownProps {
  result: GemScoreResult;
}

const WARNING_LABELS: Record<string, { label: string; description: string }> = {
  card_in_holder: { label: "Card in holder", description: "Holder/sleeve may affect grading accuracy" },
  single_image: { label: "Front only", description: "Back image not available for analysis" },
  low_confidence: { label: "Low confidence", description: "AI confidence below 60%" },
  low_resolution: { label: "Low resolution", description: "Image quality may affect accuracy" }
};

const SUBGRADE_LABELS: Record<string, string> = {
  centering: "Centering",
  corners: "Corners",
  edges: "Edges",
  surface: "Surface"
};

function getSubgradeColor(value: number): string {
  if (value >= 8) return "bg-green-500";
  if (value >= 6) return "bg-yellow-500";
  return "bg-red-500";
}

function getSubgradeTextColor(value: number): string {
  if (value >= 8) return "text-green-500";
  if (value >= 6) return "text-yellow-500";
  return "text-red-500";
}

export function GemScoreBreakdown({ result }: GemScoreBreakdownProps) {
  const { gemScore, rawGrade, confidence, subgrades, psa10Likelihood, cached, gradeSource, qualityWarnings, imagesAnalyzed } = result;
  
  const confidencePercent = Math.round(confidence * 100);
  const hasWarnings = qualityWarnings && qualityWarnings.length > 0;
  
  // PSA-10 threshold checks (updated stricter thresholds - Phase 5)
  const scoreCheck = gemScore !== null && gemScore >= 92;
  const confidenceCheck = confidence >= 0.85;
  const mediumScoreCheck = gemScore !== null && gemScore >= 85;
  const mediumConfidenceCheck = confidence >= 0.70;
  
  return (
    <div className="space-y-3 text-sm min-w-[260px]">
      {/* Overall Score */}
      {gemScore !== null && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Overall Score
            </span>
            <span className="font-bold text-lg">{gemScore}/100</span>
          </div>
          <Progress value={gemScore} className="h-2" />
        </div>
      )}
      
      {/* Calculation Formula */}
      {rawGrade !== undefined && rawGrade !== null && (
        <div className="p-2 rounded-md bg-muted/50 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>How it's calculated</span>
          </div>
          <div className="font-mono text-xs">
            <span className="text-muted-foreground">Raw Grade:</span>{" "}
            <span className="font-medium">{rawGrade.toFixed(2)}</span>
            <span className="text-muted-foreground"> (1-10 scale)</span>
          </div>
          <div className="font-mono text-xs">
            <span className="text-muted-foreground">Gem Score = </span>
            <span className="font-medium">{rawGrade.toFixed(2)} × 10 = {gemScore}</span>
          </div>
          {gradeSource && gradeSource !== 'none' && gradeSource !== 'cached' && (
            <div className="text-xs text-muted-foreground">
              Source: <code className="bg-background px-1 py-0.5 rounded text-[10px]">{gradeSource}</code>
            </div>
          )}
        </div>
      )}
      
      {/* Quality Warnings (Phase 4) */}
      {hasWarnings && (
        <div className="p-2 rounded-md bg-yellow-500/10 border border-yellow-500/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-3 w-3" />
            <span>Accuracy Warnings</span>
          </div>
          <div className="space-y-1">
            {qualityWarnings!.map(warning => {
              const info = WARNING_LABELS[warning] || { label: warning, description: '' };
              return (
                <div key={warning} className="text-xs text-yellow-700 dark:text-yellow-300">
                  <span className="font-medium">{info.label}</span>
                  {info.description && (
                    <span className="text-yellow-600/80 dark:text-yellow-400/80"> — {info.description}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Images Analyzed Indicator */}
      {imagesAnalyzed !== undefined && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Image className="h-3 w-3" />
          <span>
            {imagesAnalyzed === 2 ? 'Front + back analyzed (70/30 weighted)' : 'Front image only'}
          </span>
        </div>
      )}
      
      {/* Subgrades */}
      {subgrades && Object.keys(subgrades).length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Subgrades
          </div>
          <div className="space-y-1.5">
            {Object.entries(subgrades).map(([key, value]) => {
              if (value === undefined) return null;
              const percent = (value / 10) * 100;
              return (
                <div key={key} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{SUBGRADE_LABELS[key] || key}</span>
                    <span className={cn("font-medium", getSubgradeTextColor(value))}>
                      {value.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all", getSubgradeColor(value))}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Confidence Meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">AI Confidence</span>
          <span className="font-medium">{confidencePercent}%</span>
        </div>
        <Progress value={confidencePercent} className="h-1.5" />
      </div>
      
      {/* PSA-10 Likelihood Explanation */}
      <div className="space-y-2 pt-1 border-t border-border/50">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          PSA-10 Likelihood: <span className={cn(
            "font-bold normal-case",
            psa10Likelihood === 'High' && "text-green-500",
            psa10Likelihood === 'Medium' && "text-yellow-500",
            psa10Likelihood === 'Low' && "text-muted-foreground"
          )}>{psa10Likelihood}</span>
        </div>
        
        <div className="space-y-1 text-xs">
          {/* High threshold */}
          <div className={cn(
            "flex items-center gap-2 p-1.5 rounded",
            psa10Likelihood === 'High' ? "bg-green-500/10" : "opacity-60"
          )}>
            {scoreCheck && confidenceCheck ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span>
              <span className={scoreCheck ? "text-green-500" : ""}>Score ≥ 92</span>
              {" & "}
              <span className={confidenceCheck ? "text-green-500" : ""}>Confidence ≥ 85%</span>
              <span className="text-muted-foreground"> → High</span>
            </span>
          </div>
          
          {/* Medium threshold */}
          <div className={cn(
            "flex items-center gap-2 p-1.5 rounded",
            psa10Likelihood === 'Medium' ? "bg-yellow-500/10" : "opacity-60"
          )}>
            {mediumScoreCheck && mediumConfidenceCheck && psa10Likelihood !== 'High' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span>
              <span className={mediumScoreCheck ? "text-yellow-500" : ""}>Score ≥ 85</span>
              {" & "}
              <span className={mediumConfidenceCheck ? "text-yellow-500" : ""}>Confidence ≥ 70%</span>
              <span className="text-muted-foreground"> → Medium</span>
            </span>
          </div>
          
          {/* Low threshold */}
          <div className={cn(
            "flex items-center gap-2 p-1.5 rounded",
            psa10Likelihood === 'Low' ? "bg-muted/50" : "opacity-60"
          )}>
            {psa10Likelihood === 'Low' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="text-muted-foreground">Below thresholds → Low</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="pt-2 border-t border-border/50 space-y-1">
        <p className="text-[11px] text-muted-foreground italic">
          Photo-based AI estimate; not a guarantee of actual PSA grade.
        </p>
        {cached && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Database className="h-3 w-3" />
            <span>Cached result</span>
          </div>
        )}
      </div>
    </div>
  );
}
