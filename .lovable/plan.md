

# Speed Up Sports Lab Search + Fix Player-Only Search

## Problem 1: Search doesn't visually trigger until player AND brand are selected
Even though the code logic already sets `show_all_brands: true` when a player is first selected, there's a **400ms debounce** delay during which the UI shows "No listings found" instead of a loading skeleton. The `isLoading` flag is only set *inside* the debounce callback (after 400ms), so for that initial period the component renders with `isLoading=false` and `listings=[]`, which triggers the "No listings found" empty state.

## Problem 2: 400ms debounce is unnecessary for guided clicks
The debounce exists to handle rapid typing in quick-search mode. For guided mode (dropdown clicks), there's no need to debounce -- the search should fire immediately.

## Changes

### 1. Set `isLoading` immediately in `useSportsEbaySearch.ts`
Move `setIsLoading(true)` out of the `setTimeout` callback so the loading skeleton appears the instant `search()` is called, not 400ms later.

### 2. Reduce debounce to 150ms
The 400ms debounce is too slow. Reducing to 150ms still prevents rapid-fire duplicate requests while feeling much snappier. This benefits both guided mode clicks and quick search typing.

### 3. Reduce `LOAD_ALL_DELAY_MS` from 200ms to 100ms
The inter-page delay during the "load all" phase adds unnecessary latency. Cutting it in half speeds up total load time for fetching additional pages.

## Technical Details

**File: `src/hooks/useSportsEbaySearch.ts`**

- Line 53: Change `DEBOUNCE_MS` from `400` to `150`
- Line 55: Change `LOAD_ALL_DELAY_MS` from `200` to `100`
- Lines 90-104: Move `setIsLoading(true)` and `setListings([])` to run immediately when `search()` is called, before the debounce timer. This ensures the loading skeleton shows instantly instead of "No listings found" flashing for 150-400ms.

The structure changes from:
```text
search() called
  -> clear old timers
  -> setTimeout(400ms):
       setIsLoading(true)    <-- too late!
       fetch(...)
```

To:
```text
search() called
  -> clear old timers
  -> setIsLoading(true)      <-- immediate
  -> setListings([])         <-- clear stale results
  -> setTimeout(150ms):
       fetch(...)
```

No other files need changes. The guided search already triggers correctly when only a player is selected (the `selectPlayer` function sets `show_all_brands: true` when no brand is selected). The fix is purely about the loading state timing and debounce speed.

