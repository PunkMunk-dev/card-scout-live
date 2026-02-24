

# Unify Watchlists into Card Finder

## Goal

When a user stars/watchlists a card in Sports Lab or TCG Lab, it also appears in the Card Finder watchlist (the main shared watchlist).

## Current State

- **Card Finder**: `useWatchlist` hook stores `EbayItem` objects in localStorage (`ebay-card-watchlist` key). Used only on the Card Finder page.
- **Sports Lab**: `SportsWatchlistContext` stores `sportsEbay.EbayListing` objects in localStorage (`sports-watchlist` key). Completely separate.
- **TCG Lab**: Has a Supabase-based watchlist (`tcg_watchlist` table) but no watchlist toggle buttons on individual cards yet.

## Changes

### 1. Create a Shared Watchlist Context

Convert `useWatchlist` into a React context provider (`WatchlistProvider`) so it can be accessed from any page/component.

**New file**: `src/contexts/WatchlistContext.tsx`
- Wraps the existing `useWatchlist` logic in a context provider
- Exposes `addToWatchlist`, `removeFromWatchlist`, `isInWatchlist`, `toggleWatchlist`, `clearWatchlist`, `watchlist`, `count`
- Accepts `EbayItem` (the Card Finder type) as input

### 2. Add Adapter Functions

Create converter utilities to map Sports Lab and TCG Lab listing types into the Card Finder's `EbayItem` shape:

**New file**: `src/lib/watchlistAdapters.ts`
- `sportsListingToEbayItem(listing: sportsEbay.EbayListing): EbayItem` -- maps price (number to string), imageUrl, itemWebUrl to itemUrl, etc.
- `tcgListingToEbayItem(listing: tcg.EbayListing): EbayItem` -- maps price.value, image to imageUrl, listingType to buyingOption, etc.

### 3. Wire Sports Lab Into Shared Watchlist

Modify `SportsWatchlistContext.tsx` to also call the shared watchlist's `addToWatchlist`/`removeFromWatchlist` when toggling, using the adapter to convert the sports listing format.

### 4. Add Watchlist Button to TCG Lab Cards

Modify `TerminalCard.tsx` to add a watchlist heart/star button that:
- Calls the shared watchlist context (using the TCG adapter to convert the listing)
- Shows filled/unfilled state based on `isInWatchlist`

### 5. Mount the Provider

Wrap the app with `WatchlistProvider` in `App.tsx` (alongside the existing `SportsWatchlistProvider`).

### 6. Update Card Finder Page

Update `Index.tsx` to use the new context instead of the standalone hook.

## Files Changed

| File | Change |
|---|---|
| `src/contexts/WatchlistContext.tsx` | New -- shared watchlist context wrapping existing useWatchlist logic |
| `src/lib/watchlistAdapters.ts` | New -- adapter functions for Sports and TCG listing types |
| `src/contexts/SportsWatchlistContext.tsx` | Import shared watchlist, call adapters on toggle |
| `src/components/tcg-lab/TerminalCard.tsx` | Add watchlist heart button using shared context |
| `src/App.tsx` | Wrap app with WatchlistProvider |
| `src/pages/Index.tsx` | Switch from useWatchlist hook to shared context |
| `src/components/TabNavigation.tsx` | Update to use shared context for Card Finder badge count |

## Result

Watchlisting a card anywhere in the app adds it to the unified Card Finder watchlist, visible from the Card Finder tab's watchlist panel and reflected in the tab badge count.
