

# Relax titleMatchesQuery Threshold

## Change
In `supabase/functions/ebay-search/index.ts`, line 202, lower the name-like term match threshold from `0.75` (75%) to `0.60` (60%).

Also update the comment on line 199 to reflect the new threshold.

### Before
```ts
// Require at least 85% of name-like terms to match  (comment is already stale — actual value is 75%)
const nameTermsMatch = nameMatchRatio >= 0.75;
```

### After
```ts
// Require at least 60% of name-like terms to match
const nameTermsMatch = nameMatchRatio >= 0.60;
```

This single-line change allows queries like "Nami One Piece OP07 manga art" to return results even when eBay titles don't contain every search word (e.g., titles using "O-Nami" instead of "Nami", or omitting "manga"). The edge function will redeploy automatically.

