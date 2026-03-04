

## Plan: Individual Sport Filter Pills

Replace the grouped `All | Sports | TCG` pills with individual sport pills matching the database values.

### Changes to `src/pages/TopRoi.tsx`

1. **Update state type** — Change `sportFilter` from `'All' | 'Sports' | 'TCG'` to `string` (default `'All'`).

2. **Update pill options** — Render pills for: `All`, `Baseball`, `Basketball`, `Football`, `Hockey`, `Soccer`, `Pokemon` (labeled "TCG / Pokemon" or just "Pokemon" for consistency).

3. **Update filter logic** — In the `enriched` memo, replace the Sports/TCG branching with a simple exact match:
   ```typescript
   if (sportFilter !== 'All') {
     rows = rows.filter(r => r.card.sport === sportFilter);
   }
   ```

4. **Update snapshot state** — Already includes `sportFilter`, no change needed.

### Files modified

| File | Change |
|------|--------|
| `src/pages/TopRoi.tsx` | Replace grouped pills with individual sport pills, simplify filter logic |

