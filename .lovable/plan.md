

## Plan: Larger Hover Stats on ROI Cards

### Change (`src/components/roi/RoiCard.tsx`)

Scale up the hover overlay text and badges so they're more readable and prominent:

- **Labels** (PSA 9, PSA 10, Raw, Multiplier): `text-[10px]` → `text-xs` (12px)
- **Values** (dollar amounts, multiplier): `text-[10px]` → `text-sm` (14px), keep `font-semibold`
- **GainBadge**: `text-[10px]` → `text-xs` with slightly larger padding (`px-2 py-1`)
- **Grid gap**: `gap-x-3 gap-y-1.5` → `gap-x-4 gap-y-2.5` for breathing room
- **Overlay padding**: `p-3` → `p-4`
- **Overlay gradient**: extend the dark area higher so larger text remains readable (`rgba(0,0,0,0.4) 60%` → `rgba(0,0,0,0.6) 70%`)

Single file, ~10 lines changed. No structural changes.

