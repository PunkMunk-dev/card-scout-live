

# Clean Up Landing Page -- Remove/Fix Non-Working Items

## Issues Found

1. **"View all live listings" text** (line 438) -- looks like a link but does nothing (`cursor-default`, no `onClick`). Dead UI element.
2. **Live Market Pulse + Featured Listings glass card** -- fires 3 eBay API calls on every cold landing page load just for vanity stats. Often fails silently ("Live preview unavailable"). The featured results are generic ("rookie card") and not curated. This entire right-column glass panel adds load time and fragility for little user value.
3. **"Start Searching" button** -- calls `handleFocusSearch` which tries to focus an `<input>` element, but the search input lives in the sticky header and may not be visible/focusable on the hero viewport. Unreliable behavior.
4. **Unused imports** -- `Skeleton`, `Search` are imported but never used.
5. **`handleClear` function** -- defined but never called anywhere in the render.
6. **Console warning** -- "Function components cannot be given refs" for `Index` (harmless but noisy).

## Plan

### 1. Remove the entire Live Surface glass card (right column)

Delete the hub state, hub cache helpers, hub loader, and the right-column glass panel (Live Market Pulse + Featured Listings). This removes ~150 lines of code, 3 unnecessary API calls on page load, and all the dead/fragile UI.

**What stays**: Hero left column (headline, subtitle, CTAs) and Market Tiles below.

**Layout change**: The hero switches from a 2-column grid to a single centered column, which is cleaner and more focused.

### 2. Replace "Start Searching" with a direct link

Change the "Start Searching" button to navigate to the header search input reliably, or simply scroll up. Alternatively, keep it but use a more reliable selector.

### 3. Remove dead code

- Delete `handleClear` (unused)
- Delete unused imports (`Skeleton`, `Search`)
- Delete hub cache helpers (`readHubCache`, `writeHubCache`, `minutesAgo`, `HubPulse` type, `HUB_CACHE_KEY`, `HUB_CACHE_TTL_MS`)
- Delete hub state variables and `loadHubData` callback
- Delete `formatPrice` (only used by removed featured cards)

### 4. Remove "View all live listings" dead text

Already handled by removing the glass card entirely.

---

### Technical Summary

**File: `src/pages/Index.tsx`**

| Section | Action |
|---------|--------|
| Lines 4-7 | Remove unused imports (`Skeleton`, `Search`, `ExternalLink`) |
| Lines 37-62 | Delete hub cache helpers, `HubPulse` type, `minutesAgo` |
| Lines 79-83 | Delete hub state variables |
| Lines 166-175 | Delete `handleClear` |
| Lines 199-245 | Delete `loadHubData`, hub trigger effect, `hubLoadedRef` |
| Lines 247-250 | Delete `formatPrice` |
| Lines 362-445 | Replace 2-column hero grid with single centered column; remove glass card entirely |

The hero section becomes a clean centered layout with the headline, subtitle, and two CTA buttons, followed by the Market Tiles below.

