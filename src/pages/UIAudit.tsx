import { useState, useMemo, useCallback } from 'react';
import { Copy, Download, Trash2, ClipboardList, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getAuditSections, generateMarkdownReport, type AuditSection } from '@/lib/uiAuditData';
import { getSnapshots, clearSnapshots, exportSnapshotsJSON, type AuditSnapshot } from '@/lib/uiAuditSnapshots';

function downloadFile(content: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function UIAudit() {
  const sections = useMemo(() => getAuditSections(), []);
  const [snapshots, setSnapshots] = useState<AuditSnapshot[]>(() => getSnapshots());
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshSnapshots = useCallback(() => {
    setSnapshots(getSnapshots());
    setRefreshKey(k => k + 1);
  }, []);

  const snapshotsJson = useMemo(() => exportSnapshotsJSON(), [refreshKey]);
  const fullReport = useMemo(() => generateMarkdownReport(sections, snapshotsJson), [sections, snapshotsJson]);

  const groupedSnapshots = useMemo(() => {
    const groups: Record<string, AuditSnapshot[]> = {};
    for (const s of snapshots) {
      (groups[s.appId] ??= []).push(s);
    }
    return groups;
  }, [snapshots]);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(fullReport);
    toast.success('Full report copied to clipboard');
  };

  const handleDownloadMd = () => downloadFile(fullReport, 'ui-audit-report.md');

  const handleCopySnapshots = () => {
    navigator.clipboard.writeText(snapshotsJson);
    toast.success('Snapshots JSON copied');
  };

  const handleDownloadSnapshots = () => downloadFile(snapshotsJson, 'snapshots.json', 'application/json');

  const handleClearSnapshots = () => {
    clearSnapshots();
    refreshSnapshots();
    toast.success('Snapshots cleared');
  };

  return (
    <div className="om-page-bg min-h-screen pb-24">
      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--om-text-0)' }}>
          UI Audit Export
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--om-text-2)' }}>
          Structured report of the OmniMarket architecture for UI optimization.
        </p>

        {/* How to Use */}
        <div className="om-card p-5 mb-8" style={{ border: '1px solid var(--om-accent)', borderColor: 'hsl(211 100% 50% / 0.3)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--om-text-0)' }}>How to Use</h2>
          <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: 'var(--om-text-2)' }}>
            <li>Navigate to each app (TCG, Sports, ROI, Search) and click the <strong>📷 Snapshot</strong> button at least once (preferably: empty state, loading state, and results state).</li>
            <li>Come back to this <code>/ui-audit</code> page.</li>
            <li>Click <strong>Copy All</strong> and paste into ChatGPT.</li>
            <li>Ask for a UI optimization plan that unifies the 3 apps and improves speed + cohesion without breaking functionality.</li>
          </ol>
        </div>

        {/* Sections A–E */}
        {sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}

        {/* Snapshots Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--om-text-0)' }}>
              Snapshots ({snapshots.length})
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshSnapshots} className="text-xs">
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopySnapshots} className="text-xs" disabled={snapshots.length === 0}>
                <Copy className="h-3 w-3 mr-1" /> Copy JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadSnapshots} className="text-xs" disabled={snapshots.length === 0}>
                <Download className="h-3 w-3 mr-1" /> Download
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs text-destructive" disabled={snapshots.length === 0}>
                    <Trash2 className="h-3 w-3 mr-1" /> Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all snapshots?</AlertDialogTitle>
                    <AlertDialogDescription>This will remove all {snapshots.length} captured snapshots. This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearSnapshots}>Clear All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {snapshots.length === 0 ? (
            <div className="om-card p-6 text-center">
              <p className="text-sm" style={{ color: 'var(--om-text-3)' }}>
                No snapshots captured yet. Visit each app and click the Snapshot button.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedSnapshots).map(([appId, snaps]) => (
                <div key={appId} className="om-card p-4">
                  <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--om-text-1)' }}>
                    {appId} ({snaps.length})
                  </h3>
                  <div className="space-y-2">
                    {snaps.map((snap) => (
                      <details key={snap.id} className="text-xs">
                        <summary className="cursor-pointer py-1 font-mono" style={{ color: 'var(--om-text-2)' }}>
                          {snap.timestamp} — {snap.route}
                        </summary>
                        <pre className="mt-1 p-3 rounded text-[10px] overflow-x-auto" style={{ background: 'var(--om-bg-0)', color: 'var(--om-text-2)' }}>
                          {JSON.stringify(snap, null, 2)}
                        </pre>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 z-50 border-t" style={{ background: 'var(--om-bg-1)', borderColor: 'var(--om-border-0)' }}>
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto">
          <Button size="sm" onClick={handleCopyAll} className="text-xs shrink-0">
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Copy All
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadMd} className="text-xs shrink-0">
            <FileDown className="h-3.5 w-3.5 mr-1.5" /> Download .md
          </Button>
          <div className="border-l h-5 shrink-0" style={{ borderColor: 'var(--om-border-0)' }} />
          <Button variant="outline" size="sm" onClick={handleCopySnapshots} className="text-xs shrink-0" disabled={snapshots.length === 0}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Snapshots
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadSnapshots} className="text-xs shrink-0" disabled={snapshots.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> snapshots.json
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: AuditSection }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--om-text-0)' }}>
        {section.title}
      </h2>

      {section.detectedComponents.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--om-text-2)' }}>
            Detected Components
          </h3>
          <ul className="text-xs space-y-0.5" style={{ color: 'var(--om-text-2)' }}>
            {section.detectedComponents.map((c, i) => (
              <li key={i}>• {c}</li>
            ))}
          </ul>
        </div>
      )}

      {section.codeExcerpts.map((excerpt, i) => (
        <div key={i} className="mb-3">
          <h3 className="text-xs font-medium mb-1" style={{ color: 'var(--om-text-1)' }}>
            {excerpt.label}
          </h3>
          <pre className="om-card p-3 text-[11px] leading-relaxed overflow-x-auto font-mono" style={{ color: 'var(--om-text-2)' }}>
            {excerpt.code}
          </pre>
        </div>
      ))}

      {section.notes.length > 0 && (
        <div className="mt-2">
          <h3 className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--om-text-2)' }}>
            Notes
          </h3>
          <ul className="text-xs space-y-0.5" style={{ color: 'var(--om-text-3)' }}>
            {section.notes.map((n, i) => (
              <li key={i}>— {n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
