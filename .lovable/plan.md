

# Unified Empty State for Sports Lab and TCG Lab

## Goal

Remove the decorative backgrounds and varying wording from both labs' empty states. Replace with a single, clean, identical empty state component that says **"Select from dropdown for guided search"**.

## What Changes

### 1. Create a shared `GuidedSearchEmptyState` component

A new file `src/components/shared/GuidedSearchEmptyState.tsx` -- a minimal, visually clean empty state used by both labs:

- A small muted icon (e.g. `Search` from lucide) in a rounded circle
- Text: **"Select from dropdown for guided search"**
- No decorative background icons, no pokeballs, no straw hats, no varying titles
- Clean, centered layout matching the existing muted style both labs already use for intermediate states

### 2. Update `src/pages/TcgLab.tsx`

Replace the `<TcgEmptyState>` usage with the new shared component. This covers:
- No game selected (guided mode)
- Game selected but no chase selected (guided mode)  
- Quick mode with empty query

### 3. Update `src/pages/SportsLab.tsx`

Replace the three inline empty state blocks (lines 89-107) with the same shared component:
- Quick mode with fewer than 3 characters
- No player selected
- No brand selected

All three states will now show the same message.

### 4. Remove `src/components/tcg-lab/TcgEmptyState.tsx`

No longer needed since both labs use the shared component.

## Technical Details

**New file: `src/components/shared/GuidedSearchEmptyState.tsx`**

```tsx
import { Search } from 'lucide-react';

export function GuidedSearchEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-md">
        Select from dropdown for guided search
      </p>
    </div>
  );
}
```

**`src/pages/SportsLab.tsx`** -- Replace lines 89-100 (quick empty + player empty + brand empty) with `<GuidedSearchEmptyState />`.

**`src/pages/TcgLab.tsx`** -- Replace `<TcgEmptyState ...>` with `<GuidedSearchEmptyState />`. Remove the `TcgEmptyState` import and the `handleTrendingSelect` callback (no longer needed).

| File | Change |
|------|--------|
| `src/components/shared/GuidedSearchEmptyState.tsx` | New shared empty state component |
| `src/pages/SportsLab.tsx` | Replace 3 inline empty states with shared component |
| `src/pages/TcgLab.tsx` | Replace `TcgEmptyState` with shared component |
| `src/components/tcg-lab/TcgEmptyState.tsx` | Delete (no longer used) |

