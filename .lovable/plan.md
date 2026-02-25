

# Add More Filler Words to cleanListingTitle

## Change

**`src/lib/cleanTitle.ts`** -- Extend the existing seller promo phrases regex to also strip common eBay filler words: `LOT`, `REPACK`, `MYSTERY`, `BUNDLE`, `BREAK`, `PACK`, `BOX`, `HOBBY`.

Add a new line after the existing seller promo removal:

```typescript
// Remove eBay listing filler words
cleaned = cleaned.replace(/\b(lot|repack|mystery|bundle|break|pack|box|hobby)\b/gi, '');
```

Single line addition. No other files change.

