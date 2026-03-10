import { createContext, useContext, useReducer, useCallback, useRef, useMemo, type Dispatch } from 'react';
import type { ScannerFilters, ScannerSort, NormalizedListing, SavedScannerPreset, ScannerMode, ModeSlice, ScannerState } from '@/types/scanner';
import { DEFAULT_FILTERS } from '@/types/scanner';
import { searchEbay } from '@/lib/ebay-api';
import { transformEbayItems, sortResults } from '@/lib/transformEbayListings';
import { loadSavedSearches, persistSavedSearches } from '@/lib/scannerPresets';
import type { SortOption } from '@/types/ebay';

const EMPTY_SLICE: ModeSlice = {
  results: [],
  isLoading: false,
  error: null,
  hasSearched: false,
  hasMore: false,
  currentPage: 1,
};

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
  | { type: 'MODE_LOADING'; mode: ScannerMode }
  | { type: 'MODE_SUCCESS'; mode: ScannerMode; results: NormalizedListing[]; hasMore: boolean; page: number; append?: boolean }
  | { type: 'MODE_ERROR'; mode: ScannerMode; error: string }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'SELECT_LISTING'; id: string | null }
  | { type: 'SET_COMPARISON'; id: string | null }
  | { type: 'SET_DRAWER_MODE'; mode: 'details' | 'compare' | null }
  | { type: 'SAVE_SEARCH'; preset: SavedScannerPreset }
  | { type: 'REMOVE_SAVED'; id: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_RECENT'; recent: string[] }
  | { type: 'SET_VIEW_MODE'; mode: ScannerMode }
  // Legacy compat aliases
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; results: NormalizedListing[]; hasMore: boolean; page: number; append?: boolean }
  | { type: 'SEARCH_ERROR'; error: string };

const initialState: ScannerState = {
  query: '',
  recentQueries: loadRecent(),
  sortBy: 'bestOpportunity',
  filters: { ...DEFAULT_FILTERS },
  viewMode: 'scanner',
  scanner: { ...EMPTY_SLICE },
  rawToPsa: { ...EMPTY_SLICE },
  selectedListingId: null,
  comparisonListingId: null,
  savedSearches: loadSavedSearches(),
  sidebarOpen: false,
  drawerMode: null,
};

function updateModeSlice(state: ScannerState, mode: ScannerMode, patch: Partial<ModeSlice>): ScannerState {
  return { ...state, [mode]: { ...state[mode], ...patch } };
}

function reducer(state: ScannerState, action: Action): ScannerState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.query };
    case 'SET_SORT':
      return { ...state, sortBy: action.sortBy };
    case 'UPDATE_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };

    // ── Per-mode loading/success/error ──
    case 'MODE_LOADING':
      return updateModeSlice(state, action.mode, { isLoading: true, error: null });
    case 'MODE_SUCCESS': {
      const results = action.append
        ? [...state[action.mode].results, ...action.results]
        : action.results;
      return updateModeSlice(state, action.mode, {
        isLoading: false,
        results,
        hasMore: action.hasMore,
        currentPage: action.page,
        error: null,
        hasSearched: true,
      });
    }
    case 'MODE_ERROR':
      return updateModeSlice(state, action.mode, { isLoading: false, error: action.error, hasSearched: true });

    // ── Legacy compat: route to current viewMode slice ──
    case 'SEARCH_START':
      return updateModeSlice(state, state.viewMode, { isLoading: true, error: null });
    case 'SEARCH_SUCCESS': {
      const results = action.append
        ? [...state[state.viewMode].results, ...action.results]
        : action.results;
      return updateModeSlice(state, state.viewMode, {
        isLoading: false, results, hasMore: action.hasMore, currentPage: action.page, error: null, hasSearched: true,
      });
    }
    case 'SEARCH_ERROR':
      return updateModeSlice(state, state.viewMode, { isLoading: false, error: action.error, hasSearched: true });

    case 'CLEAR_SEARCH':
      return {
        ...state,
        query: '',
        scanner: { ...EMPTY_SLICE },
        rawToPsa: { ...EMPTY_SLICE },
        selectedListingId: null,
        drawerMode: null,
      };

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
    case 'SET_VIEW_MODE':
      // Preserve both mode slices — just switch active view
      return { ...state, viewMode: action.mode };
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
  /** The active mode's state slice */
  activeModeState: ModeSlice;
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

    const currentMode = state.viewMode;
    console.log(`[Scanner] runSearch mode=${currentMode} query="${q}" page=${page}`);

    pushRecent(q);
    dispatch({ type: 'SET_RECENT', recent: loadRecent() });
    dispatch({ type: 'SET_QUERY', query: q });

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    dispatch({ type: 'MODE_LOADING', mode: currentMode });

    const activeFilters = { ...state.filters, ...(filtersOverride || {}) };
    if (filtersOverride) dispatch({ type: 'UPDATE_FILTERS', filters: filtersOverride });
    if (sortOverride) dispatch({ type: 'SET_SORT', sortBy: sortOverride });

    // Both modes use the same eBay search for raw listings
    let buyingOptions: 'ALL' | 'AUCTION' | 'FIXED_PRICE' = 'ALL';
    if (activeFilters.listingType === 'auction') buyingOptions = 'AUCTION';
    else if (activeFilters.listingType === 'bin') buyingOptions = 'FIXED_PRICE';

    try {
      const response = await searchEbay({ query: q, page, limit: 48, sort: 'best' as const, buyingOptions });
      if (ac.signal.aborted) return;

      const normalized = transformEbayItems(response.items, activeFilters);
      const sorted = sortResults(normalized, sortOverride || state.sortBy);

      console.log(`[Scanner] ${currentMode} results: ${sorted.length} items`);

      dispatch({
        type: 'MODE_SUCCESS',
        mode: currentMode,
        results: sorted,
        hasMore: response.nextPage !== null,
        page,
        append: page > 1,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMsg = err instanceof Error ? err.message : 'Search failed';
      console.error(`[Scanner] ${currentMode} search error:`, errorMsg);
      dispatch({ type: 'MODE_ERROR', mode: currentMode, error: errorMsg });
    }
  }, [state.filters, state.sortBy, state.viewMode]);

  const loadMore = useCallback(() => {
    const modeSlice = state[state.viewMode];
    if (modeSlice.isLoading || !modeSlice.hasMore || !state.query) return;
    console.log(`[Scanner] loadMore mode=${state.viewMode} nextPage=${modeSlice.currentPage + 1}`);
    runSearch(state.query, modeSlice.currentPage + 1);
  }, [state, runSearch]);

  const activeModeState = useMemo(
    () => state[state.viewMode],
    [state],
  );

  return { state, dispatch, runSearch, loadMore, activeModeState };
}

export function useScanner() {
  const ctx = useContext(ScannerContext);
  if (!ctx) throw new Error('useScanner must be inside ScannerProvider');
  return ctx;
}
