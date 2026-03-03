

## Plan: Implement New OmniMarket Logo & Icon

### What changes

1. **Copy the uploaded image** to `src/assets/omnimarket-logo.png` for use in React components, and to `public/omnimarket-logo.png` for the favicon/meta tags.

2. **Update favicon** in `index.html` — change the `<link rel="icon">` from the SVG black dot to the new logo PNG. Also update the OG image meta tags to use the new logo.

3. **Update `public/favicon.svg`** — remove or keep as fallback; primary icon becomes the PNG.

4. **Add logo image to `TabNavigation.tsx`** — place a small `<img>` (e.g. `h-7 w-7`) of the logo next to the "OmniMarket / Cards" text in the nav bar.

5. **Add logo image to `Index.tsx` landing page** — display the logo above the "OmniMarket Cards" subtitle in the hero section.

### Files changed
- `src/assets/omnimarket-logo.png` (new — copy from upload)
- `public/omnimarket-logo.png` (new — copy from upload for favicon)
- `index.html` — update favicon href and OG image
- `src/components/TabNavigation.tsx` — add logo image next to brand text
- `src/pages/Index.tsx` — add logo in hero section

