

# Add Query Simplification: Strip Decorative Terms

## Problem
Searches like "Nami One Piece OP07 manga art" return 0 results because eBay's API finds no matches for that full query string. The decorative/variant terms ("manga art", "alternate art", etc.) are too specific for the eBay search engine and kill results upstream.

## Solution
Add a query simplification step in the `ebay-search` edge function that:
1. Strips known decorative/variant terms from the query sent to eBay's API
2. Preserves those terms for client-side title boosting (re-ranking matches that contain them higher)

## File: `supabase/functions/ebay-search/index.ts`

### 1. Add decorative terms list and strip function (~line 170, near other constants)

```ts
const DECORATIVE_TERMS = [
  'manga art', 'alternate art', 'alt art', 'full art',
  'illustration rare', 'special art rare', 'secret rare',
  'textured rare', 'gold rare', 'art rare',
  'premium rare', 'hyper rare', 'rainbow rare',
  'character rare', 'super rare',
];

function simplifyQuery(query: string): { simplified: string; decorativeFound: string[] } {
  let simplified = query;
  const decorativeFound: string[] = [];
  for (const term of DECORATIVE_TERMS) {
    const regex = new RegExp(term, 'gi');
    if (regex.test(simplified)) {
      decorativeFound.push(term.toLowerCase());
      simplified = simplified.replace(regex, '').trim();
    }
  }
  // Collapse extra whitespace
  simplified = simplified.replace(/\s{2,}/g, ' ').trim();
  return { simplified, decorativeFound };
}
```

### 2. Apply simplification before sending to eBay (~line 418 in the handler)

Before calling `searchEbay`, run the query through `simplifyQuery`. Use the simplified version for the API call but keep the original for `extractKeyTerms` title matching. Also exclude decorative terms from the key terms used for filtering so they don't penalize results.

```ts
// Simplify query for eBay API (strip decorative terms)
const { simplified, decorativeFound } = simplifyQuery(query);
const searchQuery = simplified || query; // fallback if everything was stripped

const { items: rawItems, total } = await searchEbay(token, searchQuery, requestLimit, offset, sortParam, apiBuyingOptions);

// For title matching, use simplified query (don't penalize missing decorative terms)
const keyTerms = extractKeyTerms(simplified || query);
```

### 3. Boost results that contain decorative terms (optional re-ranking)

After filtering, if decorative terms were found, sort matching listings higher:

```ts
if (decorativeFound.length > 0) {
  normalizedItems.sort((a, b) => {
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    const scoreA = decorativeFound.filter(t => titleA.includes(t)).length;
    const scoreB = decorativeFound.filter(t => titleB.includes(t)).length;
    return scoreB - scoreA; // Higher match count first
  });
}
```

This boosting happens before the price re-sort for `price_asc`, so price sort will still override it when active.

## Impact
- "Nami One Piece OP07 manga art" will now search eBay for "Nami One Piece OP07" (which returns 78+ results), then boost listings with "manga art" in the title to the top
- Works for all decorative TCG terms (alt art, full art, illustration rare, etc.)
- No effect on queries without decorative terms
- Edge function redeploys automatically

