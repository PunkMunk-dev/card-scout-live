

# Remove Trending Ticker from Live Surface Card

Simple cleanup: remove the animated marquee "Trending Now" section from the glass panel to reduce visual busyness.

## Change

**File: `src/pages/Index.tsx` (lines 383-395)**

Delete the entire "Trending ticker" block inside the glass panel:
- The "Trending Now" label
- The overflow container with marquee animation
- The duplicated pill elements

This removes ~12 lines. The Live Stats section (currently at `mt-6`) becomes the first element inside the glass card -- its `mt-6` will be removed so it sits flush at the top.

No other files need changes. The `animate-marquee` keyframe and `trending` array can stay (harmless dead code) or be cleaned up later.

