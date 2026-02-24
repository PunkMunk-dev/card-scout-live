

# Clean Up Copied Card Names for Better Card Finder Results

## Problem
When copying a card title from Sports Lab or TCG Lab listings, the raw eBay listing title is copied with all the seller noise -- grading references (PSA 10, BGS 9.5), shipping promos (FREE SHIPPING), seller tags, card numbers (#123), emojis, and filler words (INVEST, HOT, RARE). Pasting this into Card Finder produces poor search results because the eBay API chokes on the extra keywords.

**Example**: "PSA 10 One Piece card Chinese Boa Hancock OP07-051 2nd Anniversary Exclusive" copies as-is, but a cleaner version like "One Piece Boa Hancock OP07-051 2nd Anniversary" would yield much better results.

## Solution
Create a shared `cleanListingTitle` utility function and use it in both card components' copy buttons.

### File 1: `src/lib/cleanTitle.ts` (new)
Create a shared utility that strips common eBay listing noise from titles:

- Remove grading references: PSA, BGS, SGC, CGC, GMA, HGA, etc. + grade numbers (e.g. "PSA 10", "BGS 9.5")
- Remove seller promo phrases: "FREE SHIPPING", "SHIPS FREE", "FAST SHIPPING", "MUST SEE", "INVEST", "HOT", "FIRE", "RARE", "L@@K", "WOW", "NM", "MINT"
- Remove population data: "POP 5", "Pop 5/100", "LOW POP", "Population 15"
- Remove card numbering noise: "#123", "No. 45" (but keep set identifiers like "OP07-051")
- Remove emojis and special unicode characters
- Remove parenthetical seller notes like "(Read Description)"
- Collapse whitespace and trim
- No arbitrary truncation -- keep the meaningful card name intact

```typescript
export function cleanListingTitle(title: string): string {
  let cleaned = title;

  // Remove emojis
  cleaned = cleaned
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '');

  // Remove grading company + grade patterns (PSA 10, BGS 9.5, SGC 98, etc.)
  cleaned = cleaned.replace(/\b(PSA|BGS|SGC|CGC|GMA|HGA|CSG|KSA|MNT|BCCG|ACE|TAG|AGS|CGA|CCIC)\s*\d+\.?\d*\b/gi, '');
  // Remove standalone grading keywords
  cleaned = cleaned.replace(/\b(graded|slab|slabbed|authenticated|gem\s*mint|gem-mint)\b/gi, '');

  // Remove population data
  cleaned = cleaned.replace(/\b(low\s+)?pop(ulation)?[:\s]*\d+(\s*[\/]\s*\d+)?(\s+of\s+\d+)?\b/gi, '');

  // Remove seller promo phrases
  cleaned = cleaned.replace(/\b(free\s+shipping|ships?\s+free|fast\s+ship(ping)?|must\s+see|invest|hot|fire|rare|wow|l@@k|look|📈|🔥)\b/gi, '');

  // Remove parenthetical notes like (Read Description), (PSA 10), etc.
  cleaned = cleaned.replace(/\([^)]{0,40}\)/g, '');

  // Remove standalone card condition shorthand
  cleaned = cleaned.replace(/\b(NM|NM\+|NM-MT|MINT|NEAR MINT|EX|VG|GOOD)\b/gi, '');

  // Remove hash card numbers like #123 but keep set IDs like OP07-051
  cleaned = cleaned.replace(/#\d+\b/g, '');

  // Remove trailing/leading dashes, pipes, slashes used as separators
  cleaned = cleaned.replace(/[|~]/g, ' ');

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Remove leading/trailing punctuation
  cleaned = cleaned.replace(/^[\s\-–—,]+|[\s\-–—,]+$/g, '').trim();

  return cleaned;
}
```

### File 2: `src/components/sports-lab/EbayListingCard.tsx`
Replace `listing.title` in the copy handler with `cleanListingTitle(listing.title)`:

```typescript
// Line 98: Change from
await navigator.clipboard.writeText(listing.title);
// To
await navigator.clipboard.writeText(cleanListingTitle(listing.title));
```

Import `cleanListingTitle` from `@/lib/cleanTitle`.

### File 3: `src/components/tcg-lab/TerminalCard.tsx`
Replace the inline `cleanTitle` (emoji strip + 60-char truncation) used for copying with `cleanListingTitle`:

```typescript
// Line 89: Change from
await navigator.clipboard.writeText(cleanTitle);
// To
await navigator.clipboard.writeText(cleanListingTitle(listing.title));
```

Keep the existing `cleanTitle` variable for display purposes (it's used in the card UI and link URLs), but use the deeper-cleaned version for clipboard.

Import `cleanListingTitle` from `@/lib/cleanTitle`.

## Technical Summary

| File | Change |
|------|--------|
| `src/lib/cleanTitle.ts` | New shared utility -- strips grading, promos, pop data, emojis, card numbers from eBay titles |
| `src/components/sports-lab/EbayListingCard.tsx` | Use `cleanListingTitle()` in copy button instead of raw `listing.title` |
| `src/components/tcg-lab/TerminalCard.tsx` | Use `cleanListingTitle()` in copy button instead of truncated `cleanTitle` |

