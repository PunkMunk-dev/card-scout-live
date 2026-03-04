

## Plan: Optimize OmniIcon M Letterform

### Current Issues

Looking at the icon at 30px in the header, I can identify these refinements:

1. **Asymmetric tops**: Left legs top at y=140, right at y=130. This creates an unintentional tilt rather than a clean "chart spike" effect.
2. **Narrow V-notch**: The inner valley (y=240→340→240) is shallow relative to the overall height, making the M harder to read at favicon size (16px).
3. **Thin inner strokes**: The negative space between the legs closes up at small sizes.

### Proposed Optimized Path

Symmetric tops, wider V-notch, and slightly more open inner geometry:

```text
Current:  M110 390 L110 140 L180 140 L256 270 L332 130 L402 130 L402 390 L332 390 L332 240 L256 340 L180 240 L180 390 Z
Proposed: M110 390 L110 132 L182 132 L256 275 L330 132 L402 132 L402 390 L338 390 L338 235 L256 345 L174 235 L174 390 Z
```

Changes:
- **Symmetric top**: both sides at y=132 — clean horizontal top edge
- **Wider outer legs**: left 110→174 (64px), right 338→402 (64px) — consistent weight
- **Deeper V-notch**: inner peaks at y=235, center bottom at y=345 — more open M shape, reads better at 16px
- **Center peak at y=275**: slightly lower, creating more breathing room in the upper half

### Files

| File | Change |
|------|--------|
| `src/components/branding/OmniIcon.tsx` | Update `d` attribute |
| `public/favicon.svg` | Update `d` attribute to match |

Two files, same single-line path change in each.

