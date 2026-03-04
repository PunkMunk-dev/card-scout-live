

## Clean Up Dashboard Layout

The dashboard currently stacks 5 distinct sections vertically (PageHeader → Quick Start → Recent Searches → Suggested Searches → ROI card → Tip), each with its own uppercase section header, making it feel busy and cluttered. The fix: merge related sections and remove visual noise.

### Changes to `src/pages/Index.tsx` (lines 219–316)

**Remove/Merge:**
- Drop the "Quick Start" section header label — the cards are self-explanatory
- Merge "Recent Searches" and "Suggested Searches" into one section called "Search Ideas" — recent pills first, then suggested, no separate headers for each
- Remove the bottom "Tip" line (redundant with suggested searches above)
- Remove the right column entirely — fold the ROI link into the Quick Start row as a 4th card instead of a separate sidebar column
- Use a single full-width layout instead of the 8/12 + 4/12 grid

**Spacing:**
- Reduce `space-y-8` between sections to `space-y-6`
- Reduce outer padding from `py-6 md:py-10` to `py-4 md:py-6`
- Quick Start cards: tighten padding from `p-5` to `p-4`

**Result structure:**
```
PageHeader (title + subtitle + snapshot)
────────────────────────────────────────
[eBay Search] [TCG Market] [Sports Market] [Top ROI]   ← 4 cards, single row
────────────────────────────────────────
Search Ideas                                            ← one combined section
  [recent pill] [recent pill] ... [suggested pill] ...  ← mixed pills, recents first
```

### Files touched
| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Flatten to single column, merge search sections, add ROI as 4th quick-start card, remove tip |

