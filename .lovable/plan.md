

## Replace OmniIcon with Uploaded Monogram

### Approach
1. Copy the uploaded image to `src/assets/omni-icon.png`
2. Update `OmniIcon` component to render an `<img>` tag instead of inline SVG
3. Use CSS `filter: invert(1) brightness(2)` when `dark={true}` to make the black monogram appear white
4. The original image has a white background — but since the user wants transparency, I'll set the background to transparent on the wrapper and use `mix-blend-mode: multiply` in light mode (hides white bg) and `mix-blend-mode: screen` in dark mode with invert

**Simpler approach**: Since the image is black-on-white, use `filter: invert(1)` for dark mode and `mix-blend-mode: multiply` to make the white background disappear against any surface.

### Files Changed
- **Copy** `user-uploads://image-11.png` → `src/assets/omni-icon.png`
- **`src/components/branding/OmniIcon.tsx`** — Replace SVG with `<img>` using the imported asset, apply `mix-blend-mode: multiply` (light) / `mix-blend-mode: screen` + `filter: invert(1)` (dark) to handle transparency and theme switching

