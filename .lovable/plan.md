

# TCG Lab: Pokémon-themed Empty State Background + Tooltip

## 1. Pokémon-themed Background for Empty State

Replace the plain white/background empty state with a subtle Pokémon-themed decorative background. Since no background images exist in the project, we'll use CSS-rendered decorative elements -- large, faded Pokéball SVG silhouettes scattered behind the empty state content, similar to how the Card Finder previously had decorative blur circles.

**File: `src/components/tcg-lab/TcgEmptyState.tsx`**

- Wrap the empty state in a `relative overflow-hidden` container
- Add 2-3 large, faded `PokeballIcon` elements positioned absolutely behind the content at ~3-5% opacity
- These decorative pokéballs will be scattered at different sizes and rotations to create a subtle branded background
- When `selectedGame` is `one_piece`, use the `StrawHatIcon` instead, keeping the theming game-aware
- When no game is selected, show Pokéball icons as the default (since Pokémon is the primary TCG)

Example layout of decorative elements:
- Top-right: large (w-64 h-64) Pokéball at 4% opacity, rotated 15deg
- Bottom-left: medium (w-48 h-48) Pokéball at 3% opacity, rotated -20deg
- Center-left: small (w-32 h-32) Pokéball at 5% opacity, rotated 30deg

## 2. Tooltip on Empty State Title

Add a tooltip to the empty state that says: **"Select a TCG for guided or use quick search to search market"**

**File: `src/components/tcg-lab/TcgEmptyState.tsx`**

- Import `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/components/ui/tooltip`
- Wrap the title + subtitle block in a `Tooltip` component
- The tooltip trigger will be the icon container (the round circle with the Terminal/Crosshair/Anchor icon)
- Tooltip content: "Select a TCG for guided or use quick search to search market"
- Use `side="bottom"` so it appears below the icon

## Files Changed

| File | Change |
|---|---|
| `src/components/tcg-lab/TcgEmptyState.tsx` | Add decorative Pokéball/StrawHat background icons + tooltip on the icon |

