

## Plan: Adjust OmniLogo Spacing and Market Color

**`src/components/branding/OmniLogo.tsx`** — Two changes:

1. **Gap**: Increase `gap-2` (8px) to `gap-2.5` (10px) for more breathing room between the 34px icon and wordmark.
2. **"Market" color**: Bring "Market" closer to "Omni" in luminance so it doesn't look washed out or disconnected. Change from `#7F8AA3`/`#6B7280` to `#A0AAC0` (dark) and `#4B5563` (light) — still muted but more cohesive.

| Property | Current | Proposed |
|----------|---------|----------|
| Gap | `gap-2` (8px) | `gap-2.5` (10px) |
| "Market" dark | `#7F8AA3` | `#A0AAC0` |
| "Market" light | `#6B7280` | `#4B5563` |

One file, two lines changed.

