import { createContext, useContext, useReducer, useCallback, useEffect, useRef, useMemo, type Dispatch } from 'react';
import type { ScannerState, ScannerFilters, ScannerSort, NormalizedListing, SavedScannerPreset } from '@/types/scanner';
import { DEFAULT_FILTERS } from '@/types/scanner';
import { searchEbay } from '@/lib/ebay-api';
import { transformEbayItems, sortResults } from '@/lib/transformEbayListings';
import { loadSavedSearches, persistSavedSearches } from '@/lib/scannerPresets';
import type { EbayItem, SortOption } from '@/types/ebay';

// ─── Recent queries ─────────────────────────────────────
const RECENT_KEY = 'omni_recent_searches_v1';
function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function pushRecent(q: string) {
  const t = q.trim();
  if (!t) return;
  try {
    const list = loadRecent().filter(x => x !== t);
    list.unshift(t);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {}
}

// ─── Actions ────────────────────────────────────────────
type Action =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_SORT'; sortBy: ScannerSort }
  | { type: 'UPDATE_FILTERS'; filters: Partial<ScannerFilters> }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; results: NormalizedListing[]; hasMore: boolean; page: number; append?: boolean }
  | { type: 'SEARCH_ERROR'; error: string }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'SELECT_LISTING'; id: string | null }
  | { type: 'SET_COMPARISON'; id: string | null }
  | { type: 'SET_DRAWER_MODE'; mode: 'details' | 'compare' | null }
  | { type: 'SAVE_SEARCH'; preset: SavedScannerPreset }
  | { type: 'REMOVE_SAVED'; id: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_RECENT'; recent: string[] }
  | { type: 'SET_VIEW_MODE'; mode: 'scanner' | 'rawToPsa' };

const initialState: ScannerState = {
  query: '',
  recentQueries: loadRecent(),
  sortBy: 'bestOpportunity',
  filters: { ...DEFAULT_FILTERS },
  results: [],
  selectedListingId: null,
  comparisonListingId: null,
  savedSearches: loadSavedSearches(),
  isLoading: false,
  error: null,
  hasMore: false,
  currentPage: 1,
  sidebarOpen: false,
  drawerMode: null,
};

function reducer(state: ScannerState, action: Action): ScannerState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.query };
    case 'SET_SORT':
      return { ...state, sortBy: action.sortBy };
    case 'UPDATE_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'SEARCH_START':
      return { ...state, isLoading: true, error: null };
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        results: action.append ? [...state.results, ...action.results] : action.results,
        hasMore: action.hasMore,
        currentPage: action.page,
        error: null,
      };
    case 'SEARCH_ERROR':
      return { ...state, isLoading: false, error: action.error };
    case 'CLEAR_SEARCH':
      return { ...state, query: '', results: [], hasMore: false, currentPage: 1, error: null, selectedListingId: null, drawerMode: null };
    case 'SELECT_LISTING':
      return { ...state, selectedListingId: action.id, drawerMode: action.id ? 'details' : null };
    case 'SET_COMPARISON':
      return { ...state, comparisonListingId: action.id, drawerMode: action.id ? 'compare' : state.drawerMode };
    case 'SET_DRAWER_MODE':
      return { ...state, drawerMode: action.mode };
    case 'SAVE_SEARCH': {
      const saved = [action.preset, ...state.savedSearches.filter(s => s.id !== action.preset.id)].slice(0, 20);
      persistSavedSearches(saved);
      return { ...state, savedSearches: saved };
    }
    case 'REMOVE_SAVED': {
      const saved = state.savedSearches.filter(s => s.id !== action.id);
      persistSavedSearches(saved);
      return { ...state, savedSearches: saved };
    }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_RECENT':
      return { ...state, recentQueries: action.recent };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────
interface ScannerContextValue {
  state: ScannerState;
  dispatch: Dispatch<Action>;
  runSearch: (query: string, page?: number, filtersOverride?: Partial<ScannerFilters>, sortOverride?: ScannerSort) => void;
  loadMore: () => void;
}

export const ScannerContext = createContext<ScannerContextValue | null>(null);

export function useScannerReducer() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (
    query: string,
    page = 1,
    filtersOverride?: Partial<ScannerFilters>,
    sortOverride?: ScannerSort,
  ) => {
    const q = query.trim();
    if (!q) return;

    pushRecent(q);
    dispatch({ type: 'SET_RECENT', recent: loadRecent() });
    dispatch({ type: 'SET_QUERY', query: q });

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    dispatch({ type: 'SEARCH_START' });

    const activeFilters = { ...state.filters, ...(filtersOverride || {}) };
    if (filtersOverride) dispatch({ type: 'UPDATE_FILTERS', filters: filtersOverride });
    if (sortOverride) dispatch({ type: 'SET_SORT', sortBy: sortOverride });

    // Map scanner filters to eBay API params
    let apiSort: SortOption = 'best';
    let buyingOptions: 'ALL' | 'AUCTION' | 'FIXED_PRICE' = 'ALL';
    if (activeFilters.listingType === 'auction') buyingOptions = 'AUCTION';
    else if (activeFilters.listingType === 'bin') buyingOptions = 'FIXED_PRICE';

    try {
      const response = await searchEbay({ query: q, page, limit: 48, sort: apiSort, buyingOptions });
      if (ac.signal.aborted) return;

      const normalized = transformEbayItems(response.items, activeFilters);
      const sorted = sortResults(normalized, sortOverride || state.sortBy);

      dispatch({
        type: 'SEARCH_SUCCESS',
        results: sorted,
        hasMore: response.nextPage !== null,
        page,
        append: page > 1,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      dispatch({ type: 'SEARCH_ERROR', error: err instanceof Error ? err.message : 'Search failed' });
    }
  }, [state.filters, state.sortBy]);

  const loadMore = useCallback(() => {
    if (state.isLoading || !state.hasMore || !state.query) return;
    runSearch(state.query, state.currentPage + 1);
  }, [state.isLoading, state.hasMore, state.query, state.currentPage, runSearch]);

  return { state, dispatch, runSearch, loadMore };
}

export function useScanner() {
  const ctx = useContext(ScannerContext);
  if (!ctx) throw new Error('useScanner must be inside ScannerProvider');
  return ctx;
}
