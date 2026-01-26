import { Award, TrendingUp, Info, AlertTriangle, Database, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { GemRateResult } from "@/types/gemScore";

interface GemRateBreakdownProps {
  result: GemRateResult;
}

const QC_RATING_LABELS: Record<string, { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: 'text-green-500' },
  good: { label: 'Good', color: 'text-emerald-500' },
  average: { label: 'Average', color: 'text-yellow-500' },
  poor: { label: 'Poor', color: 'text-red-500' },
};

const MATCH_TYPE_LABELS: Record<string, string> = {
  exact: 'Exact match found',
  product: 'Same product line',
  brand: 'Same brand',
  era: 'Era estimate',
  default: 'General estimate',
};

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'text-green-500';
  if (confidence >= 0.70) return 'text-emerald-500';
  if (confidence >= 0.50) return 'text-yellow-500';
  return 'text-red-500';
}

function getGemRateColor(rate: number): string {
  if (rate >= 45) return 'bg-green-500';
  if (rate >= 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function GemRateBreakdown({ result }: GemRateBreakdownProps) {
  // Real pop data from listing display
  if (result.isRealData && result.psa10Count !== undefined) {
    return (
      <div className="space-y-3 min-w-[240px]">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          <div>
            <div className="font-semibold text-lg">
              PSA 10 Pop: {result.psa10Count}
            </div>
            <div className="text-xs text-muted-foreground">From eBay Listing</div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            This population count was extracted directly from the listing. 
            Lower pop means fewer PSA 10 copies exist.
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="text-green-500">Low Pop (1-5):</span>
              <span>Very rare</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-500">Medium (6-20):</span>
              <span>Uncommon</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High (20+):</span>
              <span>Common</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Certified grade display
  if (result.certifiedGrade) {
    return (
      <div className="space-y-3 min-w-[240px]">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-500" />
          <div>
            <div className="font-semibold text-lg">
              {result.certifiedGrade.company} {result.certifiedGrade.grade}
            </div>
            <div className="text-xs text-muted-foreground">Certified Grade</div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            This card has already been professionally graded. The grade shown is extracted directly from the listing title.
          </p>
        </div>
      </div>
    );
  }
  
  // Error or no data
  if (result.gemRate === null) {
    return (
      <div className="space-y-2 min-w-[200px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{result.error || 'Unable to analyze'}</span>
        </div>
      </div>
    );
  }
  
  const qcInfo = QC_RATING_LABELS[result.qcRating] || QC_RATING_LABELS.average;
  
  return (
    <div className="space-y-4 min-w-[280px] max-w-[320px]">
      {/* Header with main rate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <div className="font-semibold text-lg">{result.gemRate}% Gem Rate</div>
            <div className="text-xs text-muted-foreground">Historical PSA 10 rate</div>
          </div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-md text-xs font-medium",
          result.psa10Likelihood === 'High' && "bg-green-500/10 text-green-500",
          result.psa10Likelihood === 'Medium' && "bg-yellow-500/10 text-yellow-500",
          result.psa10Likelihood === 'Low' && "bg-red-500/10 text-red-500",
        )}>
          {result.psa10Likelihood}
        </div>
      </div>
      
      {/* Rate visualization */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>PSA 10 Rate</span>
          <span>{result.gemRate}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all", getGemRateColor(result.gemRate))}
            style={{ width: `${result.gemRate}%` }}
          />
        </div>
      </div>
      
      {/* PSA 9 rate if available */}
      {result.psa9Rate !== undefined && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>PSA 9 Rate</span>
            <span>{result.psa9Rate}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${result.psa9Rate}%` }} />
          </div>
        </div>
      )}
      
      {/* Data source info */}
      <div className="pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs">
          <Database className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {result.dataPoints > 0 
              ? `Based on ${result.dataPoints.toLocaleString()} graded cards`
              : MATCH_TYPE_LABELS[result.matchType] || 'Estimate'
            }
          </span>
        </div>
        {result.source && result.source !== 'Default' && (
          <div className="flex items-center gap-2 text-xs mt-1">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Source: {result.source}</span>
          </div>
        )}
      </div>
      
      {/* QC Rating */}
      <div className="pt-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Quality Control</span>
          <span className={cn("text-xs font-medium", qcInfo.color)}>{qcInfo.label}</span>
        </div>
        {result.qcNotes && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {result.qcNotes}
          </p>
        )}
      </div>
      
      {/* Modifiers applied */}
      {result.modifiersApplied && result.modifiersApplied.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <div className="text-xs font-medium mb-1.5">Adjustments Applied</div>
          <div className="space-y-1">
            {result.modifiersApplied.map((modifier, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                <span>{modifier}</span>
              </div>
            ))}
          </div>
          {result.baseRate !== undefined && (
            <div className="text-xs text-muted-foreground mt-1.5">
              Base rate: {result.baseRate}%
            </div>
          )}
        </div>
      )}
      
      {/* Card metadata */}
      {result.cardMetadata && (result.cardMetadata.year || result.cardMetadata.brand) && (
        <div className="pt-2 border-t border-border/50">
          <div className="text-xs font-medium mb-1.5">Detected Card Info</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {result.cardMetadata.year && (
              <>
                <span>Year:</span>
                <span>{result.cardMetadata.year}</span>
              </>
            )}
            {result.cardMetadata.brand && (
              <>
                <span>Brand:</span>
                <span>{result.cardMetadata.brand}</span>
              </>
            )}
            {result.cardMetadata.product && (
              <>
                <span>Product:</span>
                <span>{result.cardMetadata.product}</span>
              </>
            )}
            {result.cardMetadata.setName && (
              <>
                <span>Set:</span>
                <span>{result.cardMetadata.setName}</span>
              </>
            )}
            {result.cardMetadata.isRookie && (
              <>
                <span>Rookie:</span>
                <span className="text-green-500">Yes</span>
              </>
            )}
            {result.cardMetadata.isAuto && (
              <>
                <span>Auto:</span>
                <span className="text-purple-500">Yes</span>
              </>
            )}
            {result.cardMetadata.isNumbered && (
              <>
                <span>Numbered:</span>
                <span className="text-blue-500">{result.cardMetadata.isNumbered}</span>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Confidence indicator */}
      <div className="pt-2 border-t border-border/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className={cn("font-medium", getConfidenceColor(result.confidence))}>
            {Math.round(result.confidence * 100)}%
          </span>
        </div>
        <Progress 
          value={result.confidence * 100} 
          className="h-1.5 mt-1"
        />
      </div>
      
      {/* Likelihood explanation */}
      <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
        <div className="font-medium mb-1">PSA 10 Likelihood Thresholds</div>
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span className="text-green-500">High:</span>
            <span>≥45% gem rate</span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-500">Medium:</span>
            <span>30-44% gem rate</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-500">Low:</span>
            <span>&lt;30% gem rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Legacy export for backward compatibility
export { GemRateBreakdown as GemScoreBreakdown };
