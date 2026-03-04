

## Plan: Stable Focus Contract + Simplify GlobalSearchContext + UI Polish

Five changes across 3 files. The `register` pattern stays for TCG/Sports/ROI pages (they do page-specific things like switching to quick mode), but Index stops using it since it just navigates to itself.

### 1. `src/components/layout/AppShell.tsx`
- Add `useEffect, useRef` to imports
- Create `searchInputRef = useRef<HTMLInputElement>(null)`
- Add `ref={searchInputRef}` and `data-omni-global-search="true"` to both mobile and desktop `<input>`
- Add `useEffect` that listens for `omni:focus-search` custom event and calls `searchInputRef.current?.focus()` with a fallback `querySelector('[data-omni-global-search]')`

### 2. `src/contexts/GlobalSearchContext.tsx`
- Keep `register` (TCG, Sports, ROI still use it for mode switching)
- Change `submitSearch` fallback: when no handler registered, navigate to `/?q=...` (already does this — no change needed here)
- No changes required; the context already navigates when no handler is registered

### 3. `src/pages/Index.tsx`
- **Remove** the `useGlobalSearch` import and the `register` effect (lines 74–81) — Index doesn't need to register since the context's default behavior already navigates to `/?q=...`
- **Replace** the brittle `document.querySelector('header input[type="text"]')` in the "Live eBay Search" card action with `window.dispatchEvent(new Event("omni:focus-search"))`
- **Unify search pill styles**: all pills get the same neutral `om-bg-2` surface with border; recent pills get a small `↺` prefix icon instead of a different background color

### Files touched

| File | What changes |
|------|-------------|
| `src/components/layout/AppShell.tsx` | Add `searchInputRef`, `data-omni-global-search` attr, `omni:focus-search` listener |
| `src/pages/Index.tsx` | Remove register effect, use focus event for eBay card, unify pill styles |

`GlobalSearchContext.tsx` — no changes needed (already navigates to `/` when no handler registered).

