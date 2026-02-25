

# Treat "one piece" as a Compound Term in extractKeyTerms

## Problem
When a user searches "Nami One Piece OP07", `extractKeyTerms` splits it into `["nami", "one", "piece", "op07"]`. The word "one" (3 chars) and "piece" (5 chars) each become separate name-like terms that must individually appear in eBay titles -- but many listings say "OP" or omit "One Piece" entirely, hurting match rates.

## Change
In `supabase/functions/ebay-search/index.ts`, add a compound-term collapsing step at the start of `extractKeyTerms`. Before splitting on whitespace, replace known multi-word phrases with their joined form so they're treated as a single token.

### File: `supabase/functions/ebay-search/index.ts`

Add a `COMPOUND_TERMS` map and apply it in `extractKeyTerms`:

```ts
const COMPOUND_TERMS: Record<string, string> = {
  'one piece': 'onepiece',
  'dragon ball': 'dragonball',
  'magic the gathering': 'magicthegathering',
  'yu gi oh': 'yugioh',
  'yu-gi-oh': 'yugioh',
};

function extractKeyTerms(query: string): string[] {
  let normalized = query.toLowerCase().replace(/[#\-]/g, ' ');

  // Collapse compound terms into single tokens
  for (const [phrase, token] of Object.entries(COMPOUND_TERMS)) {
    normalized = normalized.replace(new RegExp(phrase, 'gi'), token);
  }

  const stopWords = ['the', 'a', 'an', 'and', 'or', 'of', 'in', 'for', 'to', 'with'];
  return normalized
    .split(/\s+/)
    .filter(term => {
      if (term.length === 0) return false;
      if (stopWords.includes(term)) return false;
      if (term.length <= 1) return TCG_SHORT_TERMS.has(term);
      return true;
    });
}
```

Then update `titleMatchesQuery` so the same collapsing is applied to the eBay title before matching:

```ts
function titleMatchesQuery(title: string, keyTerms: string[]): boolean {
  if (keyTerms.length === 0) return true;
  let lowerTitle = title.toLowerCase();

  // Apply same compound collapsing to the title
  for (const [phrase, token] of Object.entries(COMPOUND_TERMS)) {
    lowerTitle = lowerTitle.replace(new RegExp(phrase, 'gi'), token);
  }
  // ... rest unchanged
}
```

This ensures "Nami One Piece OP07" produces key terms `["nami", "onepiece", "op07"]` (3 terms instead of 4), and eBay titles containing "One Piece" also collapse to "onepiece" for matching.

## Impact
- Fewer false negatives for One Piece, Dragon Ball, Yu-Gi-Oh, and MTG queries
- No effect on single-word searches (Pokemon, sports cards, etc.)
- Edge function redeploys automatically

