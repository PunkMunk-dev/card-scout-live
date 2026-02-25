

# Brighten UI + Remove Header Frosted Glass

## Overview
Make the header solid (no blur/transparency) for better readability, and slightly brighten the overall dark surfaces across the app.

## Changes

### 1. `src/components/TabNavigation.tsx` -- Solid header background
- Line 88: Change `bg-[#0B0F16]/70 backdrop-blur-xl` to solid `bg-[#0E1420]` (no transparency, no blur)
- Keep the `border-b border-white/10` and `shadow` for subtle depth, just remove the frosted glass effect

### 2. `src/index.css` -- Brighten dark surface tokens
- Lift the base surface colors slightly:
  - `--om-bg-0`: `#0B0F16` to `#0F1521` (slightly brighter base)
  - `--om-bg-1`: `#0E1420` to `#131B2A` (slightly brighter surface-1)
  - `--om-bg-2`: `#121A28` to `#182233` (slightly brighter surface-2)
  - `--om-bg-3`: `#162033` to `#1E2A3E` (slightly brighter surface-3)
- Update corresponding Tailwind om color tokens in `tailwind.config.ts` to match

### 3. `tailwind.config.ts` -- Match brightened om tokens
- Update the `om.bg` object to match the new brightened values from index.css

## What stays the same
- All functionality, routing, search logic unchanged
- Text colors, accent colors unchanged
- Mobile bottom nav unchanged
- Glass panel utility class left as-is (used elsewhere optionally)

