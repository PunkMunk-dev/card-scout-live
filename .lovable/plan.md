

## Plan: Add Image Thumbnails to Live Auction Cards

### 1. Database migration — add `image_url` column to `roi_live_auctions`

```sql
ALTER TABLE public.roi_live_auctions ADD COLUMN image_url text;
```

### 2. Edge function update — capture image from eBay response

In `supabase/functions/roi-auction-scanner/index.ts`:

- Add `imageUrl` to the `AuctionItem` interface
- In `filterAndMapAuctions`, extract `item.thumbnailImages?.[0]?.imageUrl || item.image?.imageUrl || ''`
- In the upsert call (line ~263), add `image_url: auction.imageUrl`

### 3. Frontend hook — expose `image_url`

In `src/hooks/useLiveRoiAuctions.ts`, add `image_url: string | null` to the `LiveRoiAuction` interface.

### 4. UI — render thumbnail in each card

In `src/pages/TopRoi.tsx`, add an image element at the top of each auction card:

- Aspect ratio ~4:3, `object-cover`, rounded top corners
- Fallback to a neutral placeholder background on error
- Keep existing card content below the image

### Files modified

| File | Change |
|------|--------|
| `roi_live_auctions` table | Add `image_url text` column |
| `supabase/functions/roi-auction-scanner/index.ts` | Capture + upsert `image_url` |
| `src/hooks/useLiveRoiAuctions.ts` | Add `image_url` to interface |
| `src/pages/TopRoi.tsx` | Render thumbnail image in card |

