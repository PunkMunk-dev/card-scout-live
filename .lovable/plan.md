

## Plan: Refine M Proportions

### Current Analysis
The M path in a 512×512 viewBox with `rx="140"`:
```
M120 380 L120 140 L180 140 L256 260 L332 120 L392 120 L392 380 L332 380 L332 230 L256 330 L180 230 L180 380 Z
```

- Leg width: 60px (120→180, 332→392) — reasonable
- Horizontal span: 120→392 = 272px of 512 — good centering
- Vertical span: 120→380 = 260px — good
- The middle peak (y=120) overshoots the outer legs (y=140), creating the chart-spike effect

### Proposed Refinement
Thicken the legs to ~70px and vertically center better:

```
d="M110 390 L110 140 L180 140 L256 270 L332 130 L402 130 L402 390 L332 390 L332 240 L256 340 L180 240 L180 390 Z"
```

Changes:
- **Wider legs**: 70px each (110→180, 332→402) instead of 60px — bolder feel
- **Taller overall**: top at 130/140, bottom at 390 — more vertical presence
- **Middle V deeper**: valleys at y=240 (was 230) and peak at y=270 (was 260) — slightly more open
- **Stays within safe zone**: x range 110–402 centered in 512

### Files

| File | Change |
|------|--------|
| `src/components/branding/OmniIcon.tsx` | Update `d` attribute |
| `public/favicon.svg` | Update `d` attribute to match |

