
# Add Live Countdown Timer to Auction Cards

## Current State

`ListingCard.tsx` currently shows a static time-remaining string using `formatDistanceToNow` from `date-fns`. This string is computed once on render and **never updates** — so a user can leave the page open and the timer stays frozen.

## Goal

Replace the static time display with a **live countdown timer** that:
- Ticks every second showing `Xd Xh Xm Xs` format
- Color-codes by urgency: green (> 1 hour) → orange (15–60 min) → red + pulsing (< 15 min)
- Shows "Ended" when the auction has passed
- Cleans up its interval when the card unmounts (no memory leaks)

---

## Changes

### 1. Create `src/hooks/useCountdown.ts` (new file)

A reusable hook that accepts an ISO date string and returns a live-updating countdown object:

```typescript
import { useState, useEffect } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
  isUrgent: boolean;   // < 15 minutes
  isWarning: boolean;  // 15–60 minutes
  totalSeconds: number;
}

export function useCountdown(endDate: string | undefined): CountdownResult | null {
  // ...sets up a setInterval that fires every second
  // ...calculates d/h/m/s from diff between now and endDate
  // ...returns null if no endDate provided
  // ...clears interval on unmount
}
```

### 2. Update `src/components/ListingCard.tsx`

Replace `getTimeRemaining` + the static `<span>` with the `useCountdown` hook and a new `AuctionCountdown` sub-component:

**Remove:**
```typescript
import { formatDistanceToNow } from "date-fns";

const getTimeRemaining = (endDate: string) => { ... };

// and the JSX:
<span className="flex items-center gap-1 text-auction font-medium">
  <Clock className="h-3 w-3" />
  {getTimeRemaining(item.endDate)}
</span>
```

**Add:**
- Import `useCountdown` hook
- New `AuctionCountdown` component that renders the live timer with color-coded urgency:

```
// Color logic:
isEnded    → muted gray "Ended"
isUrgent   → red + animate-pulse  (< 15 min)
isWarning  → orange/amber         (15–60 min)
default    → auction red (existing color)

// Format:
- > 1 day:   "2d 4h 30m"
- < 1 day:   "4h 30m 12s"
- < 1 hour:  "30m 12s"  (with urgency color)
- < 1 min:   "45s"      (full urgency)
```

The timer displays inline where the static time currently sits — same card position, but now it ticks live.

---

## Implementation Details

- `setInterval` at 1000ms inside `useEffect`, cleaned up with `clearInterval` on unmount
- The hook re-renders the component every second — only auction cards with an `endDate` pay this cost
- No new dependencies needed (`date-fns` import for `formatDistanceToNow` can be removed from `ListingCard.tsx` entirely since the hook handles all time math natively)
- The `AuctionCountdown` component is a small inline component inside the same file — no separate file needed for it

---

## Files Changed

- `src/hooks/useCountdown.ts` — new file, the countdown logic
- `src/components/ListingCard.tsx` — swap static time for live timer component
