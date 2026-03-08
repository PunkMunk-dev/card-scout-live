

## Plan: Create 5 Cloud-Signal Logo Variants

Inspired by the uploaded cloud + signal-waves icon, I'll create 5 new SVG logo variants (26–30) that blend the cloud-signal motif with OmniMarket's universal search identity. All greyscale, theme-aware for both light and dark mode.

### The 5 Variants

| # | Name | Description |
|---|------|-------------|
| 26 | **Cloud Core** | Minimal cloud outline with 3 concentric signal arcs emanating from top-right. Clean stroke-only. |
| 27 | **Cloud Pulse** | Cloud with animated pulsing signal waves radiating outward. Subtle motion. |
| 28 | **Cloud Lens** | Cloud shape with a small magnifying glass integrated where the signal meets the cloud — tying search into the mark. |
| 29 | **Cloud Ring** | Cloud centered inside a thin circular ring with signal arcs breaking through the ring boundary. |
| 30 | **Cloud Node** | Cloud with 3 small dots at the signal-arc tips, suggesting connected marketplace nodes. |

### Theme Handling

Each variant will detect `mono` prop state and use:
- **Dark mode (default)**: white strokes/fills on transparent, with subtle white opacity layers
- **Light mode**: black/dark-grey strokes on transparent

The existing `mono` prop already switches palettes — these variants will use `accent1` (white in mono, teal otherwise) and a new `darkStroke` derived from variant context for light-mode readability.

### Files to Change

1. **`src/components/branding/OmniOrb.tsx`**
   - Extend the `variant` type to include `26 | 27 | 28 | 29 | 30`
   - Add 5 new variant entries using cloud + signal SVG geometry
   - Cloud shape: rounded path with flat bottom, signal arcs: 3 concentric quarter-circle arcs at top-right
   - Use `currentColor` approach for automatic theme adaptation via CSS

2. **`src/pages/LogoShowcase.tsx`**
   - Add a second showcase section titled "Cloud Signal Series"
   - Display variants 26–30 with dark card + light card previews at 32px, 64px, 120px
   - Same layout pattern as existing RENDITIONS grid

### SVG Geometry Approach

The cloud path will be computed relative to `cx`, `cy`, `r` (same as existing variants) so it scales properly at all sizes. Signal arcs will be 3 quarter-circle strokes at roughly 120°–30° arc, offset to the upper-right of the cloud body.

