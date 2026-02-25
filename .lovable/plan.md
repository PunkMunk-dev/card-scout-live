

# Fuzzy Matching for Watchlist Search

## Problem

When clicking the search icon on a watchlist item, the full raw eBay listing title is used as the search query verbatim. These titles contain noise like grading info, seller promo text, condition codes, and overly specific details (e.g. "360HP Korean Card"). This makes the query too narrow and eBay returns few or no matches.

## Solution

1. **Clean the title** using the existing `cleanListingTitle()` utility before passing it to search
2. **Trim the cleaned title** to its core identifying terms (first ~8 meaningful words) so eBay's search engine can fuzzy-match similar listings
3. Apply this in both the watchlist dropdown search action and the header search bar (when receiving watchlist searches)

## Changes

### 1. Create a `extractSearchQuery` helper in `src/lib/cleanTitle.ts`

Add a new exported function that:
- Runs `cleanListingTitle()` to strip grading, promos, emojis, pop data, condition codes
- Splits into words and keeps only the first 8 meaningful words (enough to identify the card without over-constraining)
- Returns a concise, fuzzy-friendly search string

```
export function extractSearchQuery(title: string, maxWords = 8): string {
  const cleaned = cleanListingTitle(title);
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  return words.slice(0, maxWords).join(' ');
}
```

### 2. Update `WatchlistDropdown.tsx` (line 56)

Import `extractSearchQuery` and use it when the search button is clicked:

```
// Before
onClick={() => onSearchItem(item.title)}

// After  
onClick={() => onSearchItem(extractSearchQuery(item.title))}
```

### 3. Update `TabNavigation.tsx` (line 110-112)

Also clean the title when the watchlist dropdown triggers a search via `onSearchItem`:

```
// Before
onSearchItem={(title) => navigate(`/?q=${encodeURIComponent(title)}`)}

// After
onSearchItem={(query) => navigate(`/?q=${encodeURIComponent(query)}`)}
```

No change needed here since the cleaning now happens in WatchlistDropdown. The variable rename is just for clarity.

## Summary

| File | Change |
|------|--------|
| `src/lib/cleanTitle.ts` | Add `extractSearchQuery()` -- cleans title and truncates to 8 words |
| `src/components/WatchlistDropdown.tsx` | Use `extractSearchQuery(item.title)` instead of raw `item.title` |

This ensures a title like "Pokémon Mega Charizard X EX 073/080 M2 RR Full Art Holo 360HP Korean Card" becomes a search for "Pokémon Mega Charizard X 073/080 M2 RR" -- specific enough to find the same card, broad enough to surface similar listings.

