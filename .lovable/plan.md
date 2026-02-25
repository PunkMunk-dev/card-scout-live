

# Add Focus Animation to Header Search

Add a smooth width expansion and subtle glow effect when the header search input is focused.

## Changes

### `src/components/TabNavigation.tsx`
- Add `isFocused` state (`useState(false)`)
- Add `onFocus` / `onBlur` handlers to the Input
- Apply a CSS transition on the form wrapper: `w-64` expands to `w-80` on focus
- Add a subtle ring/glow via conditional classes: `ring-2 ring-primary/20 border-primary/50` on focus
- Transition the search icon color from muted to primary on focus

### `src/index.css`
- No changes needed -- Tailwind transitions handle everything

## Technical Detail

The form element gets a `transition-all duration-300` class and toggles between `w-64` and `w-80` based on `isFocused`. The inner input wrapper gets a conditional glow ring. The search icon transitions color via a conditional class.

