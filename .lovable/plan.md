

# Match Sports Lab Watchlist Button to TCG Lab Style

## What Changes

The Sports Lab watchlist button currently shows a yellow star with "Watchlist" text and a count in parentheses. The TCG Lab uses a minimal grey star icon (no text, no "Watchlist" wording) with an optional small badge for the count. We'll match that pattern.

## Technical Details

**File: `src/components/sports-lab/QueryHeader.tsx`**

Two locations need updating:

### Desktop (line 95-97)
Current:
```tsx
<Button variant={watchlistOpen ? 'default' : 'ghost'} size="sm" onClick={onWatchlistToggle} className="h-9 px-3 gap-2">
  <Star className="h-4 w-4 text-yellow-500" />Watchlist{watchlistCount > 0 && <span ...>{watchlistCount}</span>}
</Button>
```

Change to:
```tsx
<Button variant="ghost" size="sm" onClick={onWatchlistToggle} className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
  <Star className="h-3.5 w-3.5" />
  {watchlistCount > 0 && (
    <Badge variant="outline" className="h-4 min-w-4 justify-center px-1 text-[9px] font-mono">{watchlistCount}</Badge>
  )}
</Button>
```

### Mobile (line 71-73)
Current:
```tsx
<Button variant={watchlistOpen ? 'default' : 'outline'} size="sm" onClick={onWatchlistToggle} className="gap-1.5">
  <Star className="h-3.5 w-3.5 text-yellow-500" />Watchlist{watchlistCount > 0 && ` (${watchlistCount})`}
</Button>
```

Change to:
```tsx
<Button variant="ghost" size="sm" onClick={onWatchlistToggle} className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
  <Star className="h-3.5 w-3.5" />
  {watchlistCount > 0 && (
    <Badge variant="outline" className="h-4 min-w-4 justify-center px-1 text-[9px] font-mono">{watchlistCount}</Badge>
  )}
</Button>
```

### Import
Add `Badge` import from `@/components/ui/badge` to the file.

## Summary

| Change | Detail |
|---|---|
| Remove yellow star color | Use default `text-muted-foreground` instead of `text-yellow-500` |
| Remove "Watchlist" text | Icon-only button, matching TCG Lab |
| Replace count format | Use `Badge` component instead of inline text/span |
| Match button styling | `variant="ghost"`, `h-8`, `text-muted-foreground hover:text-foreground` |

