

# Fix ROI Cards Query to Fetch All Rows

## Problem
The Supabase JS client caps queries at 1,000 rows by default. The current query uses `.limit(2500)` but that doesn't override the PostgREST default — it only sets an upper bound. We're getting 1,000 of the 1,879 cards.

## Solution
Use range-based pagination to fetch in chunks of 1,000 and concatenate results.

## Changes

**`src/hooks/useRoiCards.ts`** — Replace the single query with a loop that fetches in ranges:

```typescript
queryFn: async () => {
  const PAGE = 1000;
  let all: RoiCard[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('roi_cards')
      .select('*')
      .order('psa10_profit', { ascending: false })
      .range(from, from + PAGE - 1);

    if (sport && sport !== 'All') {
      query = query.eq('sport', sport);
    }

    const { data, error } = await query;
    if (error) throw error;
    all = all.concat((data || []) as unknown as RoiCard[]);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }

  return all;
},
```

Single file change, no backend or migration needed.

