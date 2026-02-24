

# Move Nav Tabs Below OmniMarket™ Brand Line

## What Changes

On desktop, split the single-row header into two rows:
- **Top row**: OmniMarket™ brand name, centered or left-aligned
- **Bottom row**: Card Finder / TCG Lab / Sports Lab nav tabs

This creates a cleaner visual hierarchy with the brand on its own line.

## Technical Details

**File: `src/components/TabNavigation.tsx`** (lines 83-92)

Change the desktop header from a single flex row to a stacked layout:

```tsx
<header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
  <div className="container">
    <div className="flex h-10 items-center">
      <span className="text-base font-bold font-display tracking-tight">
        OmniMarket™
      </span>
    </div>
    <nav className="flex items-center gap-1 pb-2">
      {navItems}
    </nav>
  </div>
</header>
```

- Brand name gets its own row with `h-10` height
- Nav tabs sit directly below with a small `pb-2` bottom padding
- Mobile bottom nav remains unchanged

| File | Change |
|---|---|
| `src/components/TabNavigation.tsx` | Split desktop header into two rows: brand on top, nav tabs below |
