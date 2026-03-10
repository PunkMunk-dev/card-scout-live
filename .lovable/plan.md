

# Fix Seed Data Fragmentation — 2 Bugs

## Root Causes

**Bug 1 — Zoro junk filter**: Seed title `"ST21-014 Roronoa Zoro One Piece Starter Deck English"` matches the junk pattern `/\bstarter deck\b/i`, so it's excluded. Only 1 raw Zoro listing survives → below Raw≥2 threshold.

**Bug 2 — Set name inconsistency in Luffy titles**: `"Romance Dawn"` vs no set match → different normalized keys (`onepiece|OP01-001|romance_dawn|en|base` vs `onepiece|OP01-001|unknown|en|base`). Each group has only 1 raw sale.

## Fix (1 file: `supabase/functions/onepiece-ingest/index.ts`)

### Change 1: Derive set name from card number prefix as fallback

In `buildNormalizedCardKey`, if `setName` is null, extract the set prefix from the card number (e.g., `OP01-001` → `OP01`, `ST21-014` → `ST21`). This prevents titles with/without explicit set names from fragmenting.

```typescript
function buildNormalizedCardKey(parsed: { ... }): string | null {
  if (!parsed.cardNumber) return null;
  // Derive set from card number prefix as fallback
  const setFallback = parsed.cardNumber.match(/^([A-Z]+\d+)/i)?.[1]?.toUpperCase() || "unknown";
  const setKey = (parsed.setName || setFallback).toLowerCase().replace(/\s+/g, "_");
  const parts = ["onepiece", parsed.cardNumber, setKey, ...];
  return parts.join("|");
}
```

### Change 2: Fix Zoro seed title to avoid junk filter

Replace `"ST21-014 Roronoa Zoro One Piece Starter Deck English"` with `"ST21-014 Roronoa Zoro One Piece Card Game ST21 English"` — removes the "Starter Deck" trigger.

### Result
After re-seeding + re-grouping: 3 cards (Luffy, Shanks, Zoro) all with Raw≥2 and PSA≥1.

