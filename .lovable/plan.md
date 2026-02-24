

# Phase 2: Port Sports Card Lab into AI Card Finder

## Overview

Port the Sports Card Lab query builder into the existing project as the `/sports` tab, replacing the current placeholder. Since subscriptions are deferred, there is no auth/Stripe dependency -- this simplifies the migration significantly.

---

## What gets built

The Sports Lab tab will have:
- A guided query builder (select sport, player, brand, traits) that searches eBay for raw sports cards
- A quick search mode for free-form searches
- PSA 10 market value overlay on each card (sold comps from eBay Finding API)
- Gem Rate badges (PSA 10 pop data from eBay Browse API)
- Local watchlist (localStorage-based, same pattern as original)
- Sorting by newest, price, quality, profit potential, ending soonest
- Auction mode toggle and price range filters
- Infinite scroll with auto-load-all

---

## Database changes

Create the Sports Card Lab schema in this project's database. This includes:

**Tables:**
- `ruleset_versions` -- versioned rulesets (draft/published/archived)
- `sports` -- sport options per ruleset (e.g., Football, Basketball)
- `players` -- player list per sport per ruleset
- `rule_items` -- brands, traits, notes per sport per ruleset
- `seller_blacklist` -- seller patterns to exclude per ruleset
- `user_roles` -- admin role management (enum: admin, user)

**Functions (RPC):**
- `get_published_ruleset_snapshot()` -- single call returns all published data as JSONB
- `has_role()` -- security definer for RLS role checks
- `publish_ruleset_version()` -- atomic publish (admin only)
- `clone_published_to_draft()` -- admin convenience
- `create_empty_draft()` -- admin convenience

**RLS Policies:**
- Public can read published rulesets and their child data
- Admins (via `has_role()`) can manage all data
- `user_roles` restricted to admins only

**Data seeding:**
- The tables will be empty initially -- you will need to populate them through the admin functions or direct inserts after migration

---

## Edge functions (4 new)

1. **`sports-ebay-search`** -- Main eBay search for raw sports cards (Browse API + Finding API fallback, with filtering for graded cards, excluded sellers, excluded brands, pagination)
2. **`sports-ebay-sold-psa`** -- PSA 10 sold comps lookup via Finding API (market value with confidence scoring, outlier rejection, recency weighting)
3. **`sports-ebay-gem-rate`** -- Gem Rate lookup via Browse API (searches PSA 10 listings, fetches item details for pop data)
4. **`sports-ebay-psa10-active`** -- PSA 10 active listings (lowest BIN price as market value)

All use existing `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` secrets (already configured). The Sports Card Lab used `EBAY_APP_ID` as the secret name -- we will map to `EBAY_CLIENT_ID` in the new functions.

---

## Frontend files (new, all namespaced under `sports-lab/`)

**Types:**
- `src/types/sportsEbay.ts` -- EbayListing, EbaySearchParams, SortOption, etc.
- `src/types/sportsQueryBuilder.ts` -- RulesetSnapshot, Player, RuleItem, QueryBuilderState, etc.

**Lib:**
- `src/lib/sportsCardsProUrl.ts` -- URL builders for eBay sold PSA 10 and GemRate links
- `src/lib/sportsSubscriptionTiers.ts` -- Tier definitions (all users get "pro" access since subscriptions are deferred)

**Hooks:**
- `src/hooks/useSportsEbaySearch.ts` -- eBay search with debounce, pagination, PSA 10 enrichment
- `src/hooks/useSportsRulesetSnapshot.ts` -- Fetches published ruleset via RPC
- `src/hooks/useSportsQueryBuilderState.ts` -- Local state machine for query builder selections
- `src/hooks/useSportsGemRate.ts` -- Gem Rate data fetching
- `src/hooks/useSportsSearchLimit.ts` -- Search limit (all unlimited since no paywall)

**Context:**
- `src/contexts/SportsWatchlistContext.tsx` -- Local watchlist (localStorage)

**Components (under `src/components/sports-lab/`):**
- `QueryHeader.tsx` -- Sticky header with sport/player/brand/trait dropdowns
- `QueryHeaderDropdown.tsx` -- Reusable dropdown component
- `QuerySummaryBar.tsx` -- Summary pills below header
- `SearchModeToggle.tsx` -- Guided vs Quick search toggle
- `QuickSearchInput.tsx` -- Free-form search input
- `EbayResultsPanel.tsx` -- Results container with sorting, filtering, pagination
- `EbayListingCard.tsx` -- Individual card with PSA 10 guide, profit calc, watchlist star
- `ResultsGrid.tsx` -- Wrapper that converts query state to search params
- `GemRateBadge.tsx` -- Inline gem rate badge with lazy loading
- `SoldCompsDialog.tsx` -- Modal showing PSA 10 sold comparables
- `WatchlistPanel.tsx` -- Watchlist drawer content
- `WatchlistStar.tsx` -- Star toggle for watchlist
- `SkeletonCard.tsx` -- Loading skeleton
- `SportSelect.tsx` -- Sport selector
- `UserMenu.tsx` -- Simplified (no auth actions since subscriptions deferred)

**Page:**
- `src/pages/SportsLab.tsx` -- Replace placeholder with full query builder page

**Styles:**
- Add Sports Lab CSS tokens to `src/index.css` (custom card styling, glass panels, gold metallic text, etc.)

---

## Files modified

- `src/index.css` -- Add Sports Lab design tokens and utility classes
- `src/pages/SportsLab.tsx` -- Replace placeholder with full implementation
- `src/App.tsx` -- Wrap with SportsWatchlistProvider

---

## What is NOT included (deferred)

- Authentication (login/signup) -- no auth required
- Stripe subscriptions -- all features free
- Admin panel for managing rulesets -- manage via database directly
- `check-subscription`, `create-checkout`, `customer-portal` edge functions

---

## Technical details

| Item | Count |
|---|---|
| New database tables | 6 |
| New database functions | 5 |
| New edge functions | 4 |
| New frontend files | ~25 |
| Modified files | 3 |

The Sports Lab edge functions will use `EBAY_CLIENT_ID` (mapped from the original project's `EBAY_APP_ID`) and `EBAY_CLIENT_SECRET`, both already configured as secrets.

