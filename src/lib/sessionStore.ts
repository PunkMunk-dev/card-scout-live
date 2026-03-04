const KEY = 'omni_session_v1';

export interface RecentSearch {
  term: string;
  route: string;
  ts: number;
}

export interface SessionState {
  lastRoute: string;
  globalQuery: string;
  tcgMode: 'guided' | 'quick';
  sportsMode: 'guided' | 'quick';
  roiSortKey: string;
  indexSortKey: string;
  recentSearches: RecentSearch[];
}

const DEFAULTS: SessionState = {
  lastRoute: '/',
  globalQuery: '',
  tcgMode: 'guided',
  sportsMode: 'guided',
  roiSortKey: 'profit-desc',
  indexSortKey: 'best',
  recentSearches: [],
};

export function getSession(): SessionState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setSession(partial: Partial<SessionState>): void {
  try {
    const current = getSession();
    sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }));
  } catch {}
}

export function clearSession(): void {
  try { sessionStorage.removeItem(KEY); } catch {}
}

export function pushRecentSearch(term: string, route: string): void {
  const t = term.trim();
  if (!t) return;
  const session = getSession();
  const entry: RecentSearch = { term: t, route, ts: Date.now() };
  const next = [entry, ...session.recentSearches.filter(s => s.term !== t)].slice(0, 10);
  setSession({ recentSearches: next });
}
