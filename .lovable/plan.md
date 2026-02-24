

# Merge TCG Lab and Sports Card Lab into AI Card Finder

## Scope Assessment

This is a large multi-phase migration. Here's what each app brings:

| Feature | TCG Lab | Sports Card Lab | AI Card Finder (current) |
|---|---|---|---|
| Edge Functions | 1 (ebay-search, different format) | 7 (ebay-search, gem-rate, sold-psa, checkout, subscription, portal) | 1 (ebay-search) |
| Auth | None | Full auth + Stripe subscriptions | None |
| Database tables | Uses sets/targets data | Rulesets, players, rule_items, user_roles, subscriptions | None |
| Components | ~25 custom | ~25 custom (query-builder/) | ~8 custom |
| Background images | 2 (pokemon-bg, one-piece-bg) | None | None |

**This cannot be done in a single step.** I recommend breaking it into 3 phases, each a separate conversation.

---

## Phase 1 -- Navigation Shell + TCG Lab (this session)

The simplest starting point: add a tabbed navigation header and port TCG Lab (no auth dependency).

### 1.1 Add shared navigation header
- Create a `TabNavigation` component with 3 tabs:
  - **Card Finder** (current app, route `/`)
  - **TCG Lab** (route `/tcg`)
  - **Sports Lab** (route `/sports`) -- placeholder for now
- Update `App.tsx` with new routes
- Move current header into the tab layout

### 1.2 Port TCG Lab frontend
Copy from TCG Lab into namespaced directories to avoid collisions:
- `src/pages/TcgLab.tsx` (adapted from TCG Lab's `Index.tsx`)
- `src/components/tcg-lab/` -- all TCG Lab components (Header, ContextBar, TerminalView, etc.)
- `src/hooks/useTcgData.ts`, `src/hooks/useRecommendations.ts`
- `src/services/ebayService.ts` (renamed to `src/services/tcgEbayService.ts`)
- `src/types/tcg.ts`, `src/types/tcgFilters.ts`
- `src/lib/tcgFilters.ts`, `src/lib/deviceId.ts`
- `src/components/icons/` (PokeballIcon, StrawHatIcon)
- Copy background images into `src/assets/`

### 1.3 Port TCG Lab edge function
- Create `supabase/functions/tcg-ebay-search/index.ts` (separate from existing `ebay-search`)
- Uses the same eBay credentials already configured
- Supports `active` and `sold` actions with TCG-specific exclusion logic
- Update `tcgEbayService.ts` to call `tcg-ebay-search`

### 1.4 Files changed/created (estimated ~35 files)
- `src/App.tsx` -- add routes
- `src/components/TabNavigation.tsx` -- new shared nav
- `src/pages/TcgLab.tsx` -- new page
- `src/pages/SportsLab.tsx` -- placeholder page
- `src/components/tcg-lab/*` -- ~15 component files
- `src/hooks/useTcgData.ts`, `useRecommendations.ts`
- `src/services/tcgEbayService.ts`
- `src/types/tcg.ts`, `tcgFilters.ts`
- `src/lib/tcgFilters.ts`, `deviceId.ts`
- `src/components/icons/*` -- 2 icon files
- `src/assets/*` -- 2 background images
- `supabase/functions/tcg-ebay-search/index.ts` -- new edge function

---

## Phase 2 -- Sports Card Lab (future session)

Port the query builder, which is more complex due to auth and subscriptions:
- Recreate database tables (rulesets, players, rule_items, user_roles) in this project's backend
- Port auth system (AuthContext, AuthPage)
- Port Stripe subscription edge functions (requires Stripe secrets)
- Port all query-builder components into `src/components/sports-lab/`
- Port remaining edge functions (gem-rate, sold-psa, etc.)

## Phase 3 -- Polish (future session)

- Unified styling across all 3 tabs
- Shared watchlist across tools
- Mobile-responsive tab navigation
- Loading states and error boundaries per tab

---

## What gets built now (Phase 1)

After this session you'll have:
- A tabbed app with Card Finder and TCG Lab fully working
- A "Sports Lab" placeholder tab ready for Phase 2
- All 3 tools accessible under one domain once published

