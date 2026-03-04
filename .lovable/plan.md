

## Plan: Replace Logo with SVG "M." Brand Mark

### Overview
Create a new SVG-based `OmniIcon` component with the chart+slab concept, an `OmniLogo` component (icon + wordmark), replace the current PNG logos in the header, and update the favicon.

### Changes

**1. Create `src/components/branding/OmniIcon.tsx`**
- SVG component: rounded square container (`rx="140"`) with a chart-style "M" path and a data-point circle
- Accepts `size` (default 36) and `dark` (boolean) props
- Dark mode: black bg, white M. | Light mode: white bg, black M.
- Refine the M path geometry so the middle peak is taller (chart spike feel)

**2. Create `src/components/branding/OmniLogo.tsx`**
- Combines `OmniIcon` + "OmniMarket" wordmark text
- Uses Inter font, weight 700, -0.02em letter-spacing
- Theme-aware via `dark` prop

**3. Update `src/components/TabNavigation.tsx`**
- Remove PNG logo imports (`omnimarket-logo.png`, `omnimarket-logo-light.png`)
- Import `OmniLogo` from branding
- Replace the `<img>` tag with `<OmniLogo dark={theme === 'dark'} />`

**4. Create `public/favicon.svg`**
- Static SVG version of the icon (black bg, white M.) to replace the current favicon
- Update `index.html` favicon link to point to `/favicon.svg` (already does)

### Files
| File | Action |
|------|--------|
| `src/components/branding/OmniIcon.tsx` | Create |
| `src/components/branding/OmniLogo.tsx` | Create |
| `src/components/TabNavigation.tsx` | Edit (swap PNG for SVG component) |
| `public/favicon.svg` | Overwrite with new M. icon |

No layout or functionality changes. Only branding swap.

