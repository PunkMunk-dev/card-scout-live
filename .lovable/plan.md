

# Increase Card Image Sizes in Scanner Results

The scanner results page uses two layouts: a **desktop table** and **mobile cards**. Both use small thumbnails currently.

## Changes — `src/components/scanner/OpportunityResultsFeed.tsx`

### Desktop table (ResultRow)
- Thumbnail: `w-10 h-10` → `w-14 h-14` (line 152/154)
- Column header width: `w-12` → `w-16` (line 77)

### Mobile cards (MobileCard)
- Image: `w-14 h-14` → `w-20 h-20` (lines 270/272)

Single file, 6 lines changed.

