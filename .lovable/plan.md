

# Fix Summary Bar Placement in TCG Lab

## Problem

The `QuerySummaryBar` in the TCG Lab is rendered **inside** the rounded card container (`bg-card/80 ... rounded-xl`), while in the Sports Lab it sits **outside** that container. This causes a visual inconsistency between the two labs.

**Sports Lab (correct):**
```text
+-- sticky wrapper -------------------------+
|  +-- rounded card ----------------------+ |
|  |  toggle / dropdowns / watchlist      | |
|  +--------------------------------------+ |
|  QuerySummaryBar (outside card)           |
+-------------------------------------------+
```

**TCG Lab (current / broken):**
```text
+-- sticky wrapper -------------------------+
|  +-- rounded card ----------------------+ |
|  |  toggle / dropdowns / watchlist      | |
|  |  QuerySummaryBar (inside card)       | |
|  +--------------------------------------+ |
+-------------------------------------------+
```

## Changes

### `src/components/tcg-lab/TcgHeader.tsx`

**Mobile (lines 187-188):** Move `{summaryBar}` from inside the card div to after it, so the structure becomes:

```tsx
        </div>  {/* end card div */}
        {summaryBar}
      </div>    {/* end sticky wrapper */}
```

**Desktop (lines 215-216):** Move `{summaryBar}` from inside `max-w-6xl` (which is inside the card div) to after the card div, wrapped in its own `max-w-6xl` container -- matching Sports Lab exactly:

```tsx
      </div>  {/* end card div */}
      <div className="max-w-6xl mx-auto">
        {summaryBar}
      </div>
    </div>    {/* end sticky wrapper */}
```

Two small moves, no logic changes. Both labs will then have identical summary bar placement.
