

# Loosen Card Finder Filters

## Summary

Three targeted changes to the `ebay-search` edge function to let more listings through.

## Changes

### File: `supabase/functions/ebay-search/index.ts`

**1. Remove `-box` from server-side exclusions (line 257)**

Change:
```text
const exclusions = '-lot -bundle -bulk -sealed -booster -box -pack -case -repack -mystery -wax -cello -blaster';
```
To:
```text
const exclusions = '-lot -bundle -bulk -sealed -booster -pack -case -repack -mystery -wax -cello -blaster';
```

The word "box" appears in legitimate card names (e.g. "Box Topper", certain card sets). The `JUNK_KEYWORDS` list still catches "box", "boxes", and "hobby box" in the client-side junk filter, so actual junk listings won't slip through.

**2. Reduce title-match threshold from 85% to 75% (line 202)**

Change:
```text
const nameTermsMatch = nameMatchRatio >= 0.85;
```
To:
```text
const nameTermsMatch = nameMatchRatio >= 0.75;
```

This allows listings that match 3 out of 4 query terms (75%) instead of requiring near-exact matches. Helps with alternate spellings, abbreviated names, and cards where the title uses different word order.

**3. Increase over-fetch multiplier from 2x to 3x (line 393)**

Change:
```text
const requestLimit = Math.min(clampedLimit * 2, 50);
```
To:
```text
const requestLimit = Math.min(clampedLimit * 3, 50);
```

With a default `clampedLimit` of 24, this fetches 50 items (capped) instead of 48, giving more headroom for filtering to still produce a full page of results. The eBay Browse API caps at 200 per request, so 50 is well within limits.

## Impact

- More results survive filtering per page
- "Box Topper" and similar legitimate listings will appear
- Slightly looser title matching allows more variant listings through while the junk filter still catches garbage

