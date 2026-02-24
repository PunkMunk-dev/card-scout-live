

# Clean Up Navigation Icons and Unify Dropdown Sizing

## Changes

### 1. Remove icons from TCG Lab and Sports Lab nav tabs

In `src/components/TabNavigation.tsx`, remove the `FlaskConical` and `Trophy` icons from the TCG and Sports tabs. Only the Card Finder tab keeps its `Search` icon. This declutters the navigation bar.

### 2. Match Sports Lab dropdown sizing to TCG Lab

In `src/components/sports-lab/QueryHeaderDropdown.tsx`, update the button styling from `text-sm` to `text-xs` and adjust padding from `px-2.5 py-1.5` to `px-3 py-1.5` to match the TCG Lab's game toggle buttons. This applies to both `QueryHeaderDropdown` and `TraitsDropdown`.

## Technical Details

### `src/components/TabNavigation.tsx`
- Change tabs array: remove icon from TCG and Sports entries (set to `null` or conditionally render)
- Alternatively, only render `<Icon>` for the Card Finder tab

### `src/components/sports-lab/QueryHeaderDropdown.tsx`
- `QueryHeaderDropdown` button (line 30): change `px-2.5 py-1.5 rounded-md text-sm` to `px-3 py-1.5 rounded-md text-xs`
- `TraitsDropdown` button (line 97): change `px-2.5 py-1.5 rounded-md text-sm` to `px-3 py-1.5 rounded-md text-xs`

These two changes create a visually consistent filter control style across both TCG Lab and Sports Lab.

