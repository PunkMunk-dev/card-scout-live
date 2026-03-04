import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { captureSnapshot, type SnapshotPayload } from '@/lib/uiAuditSnapshots';

interface CaptureSnapshotButtonProps {
  appId: string;
  getState: () => SnapshotPayload;
}

export function CaptureSnapshotButton({ appId, getState }: CaptureSnapshotButtonProps) {
  const handleCapture = () => {
    captureSnapshot(appId, getState());
    toast.success('Snapshot captured', { description: `${appId} state saved` });
  };

  return (
    <button
      onClick={handleCapture}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
      style={{
        background: 'var(--om-bg-2)',
        color: 'var(--om-text-2)',
        border: '1px solid var(--om-border-0)',
      }}
      title="Capture UI Audit Snapshot"
    >
      <Camera className="h-3 w-3" />
      <span className="hidden sm:inline">Snapshot</span>
    </button>
  );
}
