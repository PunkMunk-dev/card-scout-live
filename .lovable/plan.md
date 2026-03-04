

## Plan: Remove Period, Keep Full M

Remove the circle (period) from both the icon component and favicon, leaving only the "M" letterform.

### Changes

**1. `src/components/branding/OmniIcon.tsx`** — Delete the `<circle>` element (line 14)

**2. `public/favicon.svg`** — Remove the `<circle>` from the SVG string

Two files, one line removed from each.

