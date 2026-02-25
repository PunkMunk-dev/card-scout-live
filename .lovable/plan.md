
# Remove Icons from Market Tiles

## Change
Remove the `FlaskConical` icon from the TCG Market tile (line 246) and the `Trophy` icon from the Sports Market tile (line 257) in `src/pages/Index.tsx`.

Also clean up the now-unused `FlaskConical` and `Trophy` imports from line 4 (if not used elsewhere in the file).

## File: `src/pages/Index.tsx`

**Line 246** -- Delete:
```tsx
<FlaskConical className="h-6 w-6 text-slate-900 mb-3" />
```

**Line 257** -- Delete:
```tsx
<Trophy className="h-6 w-6 text-slate-900 mb-3" />
```

**Line 4** -- Remove `FlaskConical` and `Trophy` from the lucide-react import (keep `Loader2` and `ArrowRight`).

No other changes. Layout, routing, and functionality remain identical.
