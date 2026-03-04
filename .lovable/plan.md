

## Plan: Refine M. Icon — Fuller Geometry

### Problem
The current M path uses coordinates that push close to the edges of the 512×512 viewBox, causing clipping at the rounded corners (rx=140). The period (circle r=18) is too small relative to the M.

### Changes

**Update `src/components/branding/OmniIcon.tsx`** — Adjust the SVG path and circle:

- **Center and inset the M** within the safe area of the rounded square (~150–362 horizontal, ~140–380 vertical)
- **Widen the M strokes** so the letterform feels bolder and fuller
- **Enlarge the period** from r=18 to r=24 and reposition it closer to the M's right leg
- **Keep the chart-spike concept** (middle peak slightly taller)

New path (approximate):
```
d="M120 380 L120 140 L180 140 L256 260 L332 120 L392 120 L392 380 L332 380 L332 230 L256 330 L180 230 L180 380 Z"
```
- Legs span x=120→392 (centered in 512)
- Top range 120→380 (more vertical room)
- Middle peak at y=120 (chart spike)
- Stroke width ~60px per leg

Circle: `cx="405" cy="370" r="24"` — bigger dot, tucked closer to M.

**Update `public/favicon.svg`** — Same path changes for consistency.

Two files edited, path + circle coordinates only.

