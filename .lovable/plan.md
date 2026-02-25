
# Clean Up Dead Code: Trending Array & Marquee Animation

Remove the unused `getTrendingLabels` function, the `trending` variable, and the `marquee` keyframe/animation from Tailwind config.

## Changes

### 1. `src/pages/Index.tsx`
- Delete `getTrendingLabels()` function (lines 36-52)
- Delete `const trending = getTrendingLabels();` (line 270)

### 2. `tailwind.config.ts`
- Remove `marquee` keyframe entry (lines 155-158)
- Remove `marquee` animation entry (line 165)
