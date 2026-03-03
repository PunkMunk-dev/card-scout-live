

## Plan: Compact Stock-Terminal Sort Bar for Top ROI

Consolidate the search + sort toolbar into a single tight horizontal row styled like a terminal/stock ticker bar.

### Changes (single file: `src/pages/TopRoi.tsx`)

**Toolbar redesign** — Replace the current `flex-col sm:flex-row` layout with a single always-horizontal bar:

- Compact inline row: search input on the left (narrower, max-w-[200px]), sort pills on the right, all in one line
- Sort pills: smaller `text-[10px]` mono-font buttons with minimal padding (`px-2 py-1`), separated by a thin divider or `|` character
- Remove the `ArrowUpDown` icon — the pills are self-explanatory
- Active pill gets a subtle highlight (`om-pill-active`) with no size change
- Wrap it all in a single-height bar (`h-9`) with `items-center` so everything aligns

```
┌──────────────────────────────────────────────────────────┐
│ 🔍 Search cards...    │  Profit↑  Profit↓  Raw↓  Raw↑  Mult │
└──────────────────────────────────────────────────────────┘
```

- Toolbar class: `om-toolbar flex items-center gap-3 px-3 h-10 mb-4` (single row, no wrapping)
- Search input: `max-w-[200px] h-7 text-xs font-mono`
- Sort pills: `font-mono text-[10px] px-2 py-0.5 whitespace-nowrap` with `gap-1` between them
- A thin vertical separator (`border-l h-5`) between search and sort section

No other files change. Grid, cards, pagination, skeleton all stay the same.

