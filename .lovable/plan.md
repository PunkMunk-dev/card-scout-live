

# Phase 3: Polish and Unify

Now that all three tools (Card Finder, TCG Lab, Sports Lab) are ported, this phase focuses on visual consistency, mobile UX, and reliability.

---

## 3.1 Unified Tab Navigation (Mobile)

Currently the tab labels are hidden on small screens (`hidden sm:inline`), leaving only tiny icons. Improve this:

- Show abbreviated labels on mobile (e.g., "Cards", "TCG", "Sports")
- Add bottom-bar navigation on mobile as an alternative to the top tabs
- Highlight active tab with an underline indicator for better visibility

**Files**: `src/components/TabNavigation.tsx`

---

## 3.2 Consistent Page Layout

Each page has slightly different layout patterns. Normalize them:

- Card Finder has its own watchlist bar and decorative blobs -- wrap in a consistent layout shell
- TCG Lab uses `min-h-[calc(100vh-48px)]` -- standardize across all pages
- Sports Lab has the same calc -- keep consistent

**Files**: `src/pages/Index.tsx`, `src/pages/TcgLab.tsx`, `src/pages/SportsLab.tsx`

---

## 3.3 Error Boundaries

Add React error boundaries around each tab's content so one tab crashing doesn't take down the entire app.

- Create a reusable `ErrorBoundary` component with a "Try Again" button
- Wrap each `Route` element with the boundary

**Files**: `src/components/ErrorBoundary.tsx`, `src/App.tsx`

---

## 3.4 Loading States

Add route-level `Suspense` boundaries with consistent skeleton fallbacks so lazy-loaded pages show a uniform loading state.

- Lazy-load `TcgLab` and `SportsLab` pages (they're heavy)
- Add a shared `PageSkeleton` component

**Files**: `src/App.tsx`, `src/components/PageSkeleton.tsx`

---

## 3.5 Shared Watchlist Infrastructure (optional, lightweight)

Currently each tool has its own watchlist. For now, just add a watchlist count badge on the tab navigation for whichever tool has items, so users can see at a glance.

- Card Finder watchlist count from `useWatchlist`
- TCG watchlist count from `useTcgWatchlist`
- Sports watchlist count from `useSportsWatchlist`

**Files**: `src/components/TabNavigation.tsx`

---

## Summary

| Change | Files |
|---|---|
| Mobile-friendly tab nav | 1 |
| Consistent page layouts | 3 |
| Error boundaries | 2 |
| Lazy loading + suspense | 2 |
| Watchlist badges on tabs | 1 |
| **Total** | **~7 files** |

This is a focused polish pass -- no new features, just making the merged app feel like a single cohesive product.

