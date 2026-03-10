

# Add Active Filter Count Badge to Reset Button

## Change: `src/components/scanner/StickyFilterBar.tsx`

Compute `activeCount` by summing up each non-default filter/sort:
- `listingType !== 'all'` → +1
- Each boolean toggle (`endingSoonOnly`, `rawOnly`, `excludeGraded`, `excludeLots`) if true → +1 each
- `minPrice` set → +1
- `maxPrice` set → +1
- `sortBy !== 'bestOpportunity'` → +1

Display the count as a small inline badge next to "Reset":

```tsx
<span className="text-[11px]">Reset</span>
<span
  className="ml-0.5 inline-flex items-center justify-center rounded-full text-[9px] font-bold leading-none min-w-[16px] h-4 px-1"
  style={{ background: 'var(--om-accent)', color: '#fff' }}
>
  {activeCount}
</span>
```

Single file, ~10 lines added.

