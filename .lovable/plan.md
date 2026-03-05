

## Plan: Enhanced Edge Function Error Details in Diagnostics

### Changes

#### 1. `src/lib/diagnostics.ts` — add `inferEdgeHint`

Append a new exported function that maps HTTP status codes to friendly troubleshooting hints (401/403 auth, 404 not deployed, 429 rate limit, 500+ runtime error, 400+ bad request).

#### 2. `src/pages/Diagnostics.tsx` — expand edge test logic and UI

**Expand `EdgeResult` interface** (lines 24-30) with four new fields: `httpStatus`, `bodyPreview`, `corsOk`, `hint`.

**Add helpers** near top of file:
- `getFunctionUrl(name)` — builds `${VITE_SUPABASE_URL}/functions/v1/${name}`
- `getAuthHeaders()` — returns Content-Type, apikey, Authorization headers using the anon key
- `fetchEdgeRaw(name, payload)` — performs OPTIONS preflight check + raw POST fetch to capture HTTP status, response body preview (first 2k chars), CORS status, and hint via `inferEdgeHint`

**Replace edge test loop** (lines 130-156):
- After `supabase.functions.invoke` fails, call `fetchEdgeRaw` to populate the new fields
- On success, set `httpStatus: 200`, `corsOk: true`, others null

**Update edge result UI** (lines 256-276):
- Show HTTP status badge (color-coded: green for 2xx, red for 4xx/5xx)
- Show CORS status indicator (OK/FAIL/—)
- Show hint text in amber below function name
- Show body preview in a collapsible JsonBlock when present

### No changes to
- Any edge functions, business logic, or database schema
- DB test section or environment section

