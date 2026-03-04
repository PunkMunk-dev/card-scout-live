

## Plan: Fine-tune OmniLogo Wordmark

**`src/components/branding/OmniLogo.tsx`** — Minor refinements:

1. **Letter-spacing**: Tighten from `-0.03em` to `-0.025em` — the current value feels slightly too compressed at 22px; this eases readability while keeping the premium feel.
2. **Font weight**: Keep `font-semibold` (600) — it already matches the icon's stroke weight well.
3. **Color cohesion**: Narrow the contrast gap between "Omni" and "Market" so they read as one unified word rather than two separate elements:
   - Dark: "Omni" stays `#F5F7FF`, "Market" moves from `#A0AAC0` → `#C0C8DA` (closer in luminance)
   - Light: "Omni" stays `#111827`, "Market" moves from `#4B5563` → `#374151` (one step closer)

| Token | Current | Proposed |
|-------|---------|----------|
| Letter-spacing | `-0.03em` | `-0.025em` |
| "Market" dark | `#A0AAC0` | `#C0C8DA` |
| "Market" light | `#4B5563` | `#374151` |

One file, two lines changed.

