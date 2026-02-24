import { ExternalLink, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Psa10SoldComp } from '@/types/sportsEbay';

interface SoldCompsDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void; soldComps: Psa10SoldComp[];
  marketValue: number | null; confidence: 'high' | 'medium' | 'low' | null;
}

function formatDate(d: string | null): string {
  if (!d) return 'Unknown';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return 'Unknown'; }
}

export function SoldCompsDialog({ open, onOpenChange, soldComps, marketValue, confidence }: SoldCompsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            PSA-10 Sold Comps
            {confidence === 'high' && <Badge className="bg-green-600/90 text-white text-[10px]">High Confidence</Badge>}
            {confidence === 'medium' && <Badge variant="secondary" className="text-[10px]">Medium</Badge>}
            {confidence === 'low' && <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />Low</Badge>}
          </DialogTitle>
          <DialogDescription>{soldComps.length} recent sale{soldComps.length !== 1 ? 's' : ''}</DialogDescription>
        </DialogHeader>
        {marketValue !== null && (
          <div className="bg-muted/50 rounded-lg p-3 border">
            <div className="text-xs text-muted-foreground mb-1">Market Value (Guide)</div>
            <div className="text-2xl font-bold">${marketValue.toFixed(2)}</div>
          </div>
        )}
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {soldComps.map((comp, i) => (
              <a key={`${comp.ebayUrl}-${i}`} href={comp.ebayUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary">{comp.title}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /><span className="font-medium text-foreground">${comp.price.toFixed(2)}</span></span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(comp.soldDate)}</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </ScrollArea>
        {soldComps.length === 0 && <div className="text-center py-6 text-muted-foreground text-sm">No sold comps available</div>}
      </DialogContent>
    </Dialog>
  );
}
