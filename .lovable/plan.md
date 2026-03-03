

## Plan: Replace Logo with New Upload + Transparent Favicon

### Changes

1. **Copy uploaded image** to `src/assets/omnimarket-logo.png` and `public/omnimarket-logo.png` — replacing the current logo everywhere (nav bar, hero, favicon).

2. **Create a transparent 32x32 favicon** — Use an edge function with Gemini image editing to:
   - Remove the white background from the uploaded logo (make fully transparent)
   - The result gets saved as `public/favicon.png` at a web-friendly size

3. **Update `index.html`** — Point favicon `<link>` to `/favicon.png` for crisp browser tab rendering.

### Files changed
- `src/assets/omnimarket-logo.png` — replaced with upload
- `public/omnimarket-logo.png` — replaced with upload
- `public/favicon.png` — new, transparent version for favicon
- `index.html` — favicon href updated
- `supabase/functions/remove-bg/index.ts` — temporary edge function to process the image (deleted after use)

