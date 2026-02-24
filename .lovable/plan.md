

# Integrate ContextBar into TcgHeader

## What Changes

Move the summary bar (currently a separate `ContextBar` component rendered in `TcgLab.tsx`) directly into the `TcgHeader` component, matching how Sports Lab's `QuerySummaryBar` is integrated into its header. This eliminates the separate component and creates a single cohesive header block.

## Technical Details

### File: `src/components/tcg-lab/TcgHeader.tsx`

Add new props for summary bar data:
- `totalCount: number`
- `isSearchLoading: boolean`

Add an inline summary bar below the main controls row (inside the rounded-xl container), matching the `QuerySummaryBar` pattern:
- A thin `h-8` row with `border-t border-border/20` separator
- Left side: "Showing: Target . Set . Raw Singles" (dot-separated, same as current ContextBar)
- Right side: result count badge or "Searching..." when loading
- Only visible when there's an active query (guided mode with target selected, or quick mode with query entered)
- For quick mode, show the query text instead of target/set

### File: `src/pages/TcgLab.tsx`

- Remove the standalone `<ContextBar>` rendering (lines 53-61)
- Remove the `ContextBar` import
- Pass `totalCount` and `isSearchLoading` as new props to `<TcgHeader>`

### File: `src/components/tcg-lab/ContextBar.tsx`

- No changes needed; it can remain for potential reuse, but will no longer be used by TcgLab

### Summary

| Aspect | Before | After |
|---|---|---|
| Summary bar location | Separate component below header | Integrated inside the header card |
| Visual result | Gap between header card and summary | Single unified header block |
| Props flow | TcgLab passes to ContextBar separately | TcgLab passes totalCount/isSearchLoading to TcgHeader |
