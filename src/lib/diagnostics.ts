export function maskKey(key: string): string {
  if (!key) return '(empty)';
  if (key.length <= 10) return '••••••';
  return key.slice(0, 6) + '••••••••' + key.slice(-4);
}

export function safeJsonStringify(obj: unknown, indent = 2): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch {
    return String(obj);
  }
}

export function inferRlsHint(
  error: { message?: string; code?: string; details?: string; hint?: string } | null,
  count?: number | null,
  sampleError?: { message?: string; code?: string } | null,
): string | null {
  if (error) {
    const code = error.code ?? '';
    const msg = (error.message ?? '').toLowerCase();
    if (code === '401' || code === '403' || msg.includes('permission') || msg.includes('policy')) {
      return 'Likely RLS or auth policy issue — rows exist but your role cannot read them.';
    }
    if (code === '42501' || msg.includes('denied')) {
      return 'Permission denied — check RLS policies for this table.';
    }
    return `Error: ${error.message ?? code}`;
  }
  if (sampleError) {
    return 'Policy may allow count/head but deny data read — check SELECT RLS.';
  }
  if (count === 0) {
    return 'Table is empty or you may be querying the wrong project.';
  }
  return null;
}
