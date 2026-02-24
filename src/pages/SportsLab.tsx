import { Construction } from 'lucide-react';

export default function SportsLab() {
  return (
    <div className="min-h-[calc(100vh-48px)] bg-background flex items-center justify-center">
      <div className="flex flex-col items-center text-center px-6">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full scale-150" />
          <div className="relative inline-flex items-center justify-center h-12 w-12 rounded-lg bg-secondary/40 border border-border/20">
            <Construction className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Sports Card Lab</h2>
        <p className="mt-2 text-sm text-muted-foreground/80 max-w-xs leading-relaxed">
          Coming soon — query builder, gem rate analysis, and graded comps for sports cards.
        </p>
      </div>
    </div>
  );
}
