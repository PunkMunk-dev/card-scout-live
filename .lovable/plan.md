

## Plan: Add Clickable Search Suggestions to Quick Search

Add contextual suggestion pills below the quick search input on each tab. When the input is empty, suggestions appear as clickable chips that populate and trigger the search.

### Changes

**1. `src/components/sports-lab/QuickSearchInput.tsx`** — Add an optional `suggestions?: string[]` prop. When the input is empty and suggestions exist, render a row of clickable pill buttons beneath the input. Clicking a pill sets the value and fires `onChange`.

**2. `src/components/sports-lab/QueryHeader.tsx`** — Pass sports-specific suggestions to `QuickSearchInput`:
```
["Mike Trout Bowman Chrome", "Wander Franco 1st", "Ohtani Topps Chrome Refractor", "Jeter SP", "Griffey PSA 10"]
```

**3. `src/components/tcg-lab/TcgHeader.tsx`** — Pass TCG-specific suggestions:
```
["Charizard VMAX", "Pikachu Gold Star", "Luffy Alternate Art", "Mewtwo GX", "Umbreon VMAX"]
```

**4. `src/pages/Index.tsx`** — The home page uses `SearchBar`, not `QuickSearchInput`, so no changes needed there (it has a different search pattern with a submit button).

### UI Behavior
- Suggestions render as small styled pills in a horizontal row below the input
- Only shown when the input is empty (no `localValue`)
- Clicking a pill immediately sets the value and triggers the search
- Pills use existing `om-pill` styling for consistency

Four files total: one component updated, two headers pass suggestions.

