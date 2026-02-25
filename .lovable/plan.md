

# Fix: Only One Listing Showing for Noisy Search Queries

## Problem

The current URL query is: `ANTHONY EDWARDS ROOKIE CARD 2020 Illusions $$ GREEN VERSION Basketball RC!`

This raw eBay title contains noise characters (`$$`, `!`) and filler words (`RC`, `VERSION`) that cause two problems:

1. **eBay returns fewer matches** because the query string itself is too specific/noisy
2. **The edge function's title-match filter rejects most results** because it extracts key terms like `$$` and `rc!` that don't appear in other listings' titles (75% match threshold fails)

## Root Cause

`cleanListingTitle()` doesn't strip:
- Currency/price symbols: `$$`, `$`, price patterns
- Trailing punctuation on words: `RC!`, `CARD!!`
- Common filler words that don't help identify a card: `RC`, `VERSION`, `CARD`, `ROOKIE CARD`, `BASKETBALL`

So even when `extractSearchQuery` cleans and truncates, the result still contains noise.

## Solution

### 1. Improve `cleanListingTitle()` in `src/lib/cleanTitle.ts`

Add rules to strip:
- Currency symbols and repeated special chars (`$$`, `$$$`, `!!!`)
- Common card-type filler words: `RC`, `ROOKIE CARD`, `BASKETBALL`, `FOOTBALL`, `BASEBALL`, `CARD`
- Trailing/leading punctuation from individual words (`RC!` becomes empty after removing `RC`)
- Stray special characters that aren't part of set IDs

### 2. No edge function changes needed

The edge function's `extractKeyTerms` already strips `#` and `-`. The real fix is ensuring the *query sent to eBay* is clean. Once `cleanListingTitle` properly strips `$$`, `RC!`, etc., the `extractSearchQuery` function (which calls `cleanListingTitle`) will produce a much better query like: `ANTHONY EDWARDS 2020 Illusions GREEN` instead of the current noisy string.

## Specific Changes

| File | Change |
|------|--------|
| `src/lib/cleanTitle.ts` | Add stripping rules for: currency symbols (`$`), repeated punctuation (`!!`, `$$`), sport-category words (`basketball`, `football`, `baseball`, `soccer`), generic card terms (`RC`, `rookie card`, `card`, `version`), and clean trailing punctuation from remaining words |

### Updated `cleanListingTitle` additions:

```typescript
// Remove currency symbols and price-like patterns
cleaned = cleaned.replace(/\$+/g, '');
cleaned = cleaned.replace(/\b\d+\s*(?:USD|EUR|GBP)\b/gi, '');

// Remove repeated punctuation (!! $$)
cleaned = cleaned.replace(/([!@#$%^&*])\1+/g, '');

// Remove sport category words (too broad for search)
cleaned = cleaned.replace(/\b(basketball|football|baseball|soccer|hockey)\b/gi, '');

// Remove generic card terms
cleaned = cleaned.replace(/\b(RC|rookie\s+card|card|cards|version|ver)\b/gi, '');

// Clean remaining punctuation from word boundaries
cleaned = cleaned.replace(/[!?]+\b|\b[!?]+/g, '');
```

After this fix, the same watchlist title becomes a search for approximately: `ANTHONY EDWARDS 2020 Illusions GREEN` -- broad enough to return dozens of relevant listings.

