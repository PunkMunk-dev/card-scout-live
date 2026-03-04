

## Plan: Refine OmniLogo Wordmark

Update the wordmark typography to better complement the geometric, angular M icon.

### Current State
The wordmark uses `font-bold text-xl` with tight letter-spacing (-0.02em) and plain black/white color. It feels generic next to the refined icon.

### Changes

**`src/components/branding/OmniLogo.tsx`** — Single file update:

1. **Font family**: Switch to `font-display` (Space Grotesk) — geometric sans that echoes the angular M letterform
2. **Weight**: Use `font-semibold` instead of `font-bold` — closer match to the icon's stroke weight
3. **Two-tone split**: Render "Omni" in primary color and "Market" in muted (`--om-text-2`) to create visual hierarchy and brand recognition
4. **Letter-spacing**: Tighten slightly to -0.03em for a more premium feel
5. **Size**: Bump to `text-[22px]` for better optical balance with the 30px icon

Result: The wordmark gains the same geometric DNA as the icon while the two-tone treatment adds brand depth.

