

## Plan: Add `/diagnostics` Route

### New Files

#### 1. `src/lib/diagnostics.ts`
Utility helpers:
- `maskKey(key)` — show first 6 + last 4 chars, mask the rest
- `safeJsonStringify(obj)` — safe JSON.stringify with error handling
- `inferRlsHint(error, count)` — map error codes/empty results to friendly hints

#### 2. `src/pages/Diagnostics.tsx`
Full diagnostics page with sections rendered as `om-card` cards:

**Environment** — check `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` presence, show masked key and URL host.

**DB Tests** — for `roi_cards` and `roi_live_auctions`:
- Count query via `.select('id', { count: 'exact', head: true })`
- Sample row via `.select('*').limit(1)` in a collapsible
- Status badges (OK/WARN/FAIL) with RLS hint detection

**Edge Function Tests** — buttons to invoke each of the 10 known functions with minimal payloads:
- `tcg-ebay-search`, `sports-ebay-search`, `roi-auction-scanner`, etc.
- Show response data or error JSON

**RLS/Access Hints** — automatic detection of 401/403, empty-but-no-error, count-vs-select mismatches

**Support Bundle** — "Copy Support Bundle" button aggregating all results + timestamp + user agent + route into JSON, with sonner toast on success

Each section has a "Run" button; top-level "Run All" button. Loading spinners per section. Monospace JSON output with per-block "Copy" buttons.

Uses `PageHeader` with title "Diagnostics", existing `om-card`/`om-toolbar`/`om-pill` styles, and `supabase` client from `@/integrations/supabase/client`.

### Modified Files

#### 3. `src/App.tsx`
Add lazy import and route:
```tsx
const Diagnostics = lazy(() => import("./pages/Diagnostics"));
// In Routes:
<Route path="/diagnostics" element={<ErrorBoundary><Diagnostics /></ErrorBoundary>} />
```

Not added to nav — accessible only by direct URL.

### No Changes To
- Any existing business logic (TCG, Sports, Index, ROI)
- Any edge functions
- Any database schema

