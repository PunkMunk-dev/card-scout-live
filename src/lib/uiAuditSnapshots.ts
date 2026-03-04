// UI Audit Snapshot capture + localStorage persistence

const STORAGE_KEY = 'ui_audit_snapshots_v1';

export interface SnapshotPayload {
  searchInputs?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  pagination?: Record<string, unknown>;
  loadingFlags?: Record<string, unknown>;
  errorState?: { message: string } | null;
  resultsSchema?: { itemKeys: string[]; count: number };
  layoutMode?: Record<string, unknown>;
}

export interface AuditSnapshot {
  id: string;
  appId: string;
  timestamp: string;
  route: string;
  searchInputs: Record<string, unknown>;
  filters: Record<string, unknown>;
  pagination: Record<string, unknown>;
  loadingFlags: Record<string, unknown>;
  errorState: { message: string } | null;
  resultsSchema: { itemKeys: string[]; count: number };
  layoutMode: Record<string, unknown>;
}

function redactValue(val: unknown): unknown {
  if (typeof val === 'string') {
    // Redact anything that looks like a token/key/secret
    if (/^(ey[A-Za-z0-9_-]{20,}|sk[-_][A-Za-z0-9]{20,}|[A-Za-z0-9]{32,})$/.test(val)) {
      return '***REDACTED***';
    }
  }
  return val;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/token|secret|key|auth|password|cookie|session/i.test(k)) {
      result[k] = '***REDACTED***';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = redactObject(v as Record<string, unknown>);
    } else {
      result[k] = redactValue(v);
    }
  }
  return result;
}

export function captureSnapshot(appId: string, payload: SnapshotPayload): AuditSnapshot {
  const snapshot: AuditSnapshot = {
    id: `${appId}-${Date.now()}`,
    appId,
    timestamp: new Date().toISOString(),
    route: window.location.pathname + window.location.search,
    searchInputs: redactObject(payload.searchInputs ?? {}),
    filters: redactObject(payload.filters ?? {}),
    pagination: redactObject(payload.pagination ?? {}),
    loadingFlags: redactObject(payload.loadingFlags ?? {}),
    errorState: payload.errorState ?? null,
    resultsSchema: payload.resultsSchema ?? { itemKeys: [], count: 0 },
    layoutMode: redactObject(payload.layoutMode ?? {}),
  };

  const existing = getSnapshots();
  existing.push(snapshot);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {}

  return snapshot;
}

export function getSnapshots(): AuditSnapshot[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearSnapshots(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportSnapshotsJSON(): string {
  return JSON.stringify(getSnapshots(), null, 2);
}
