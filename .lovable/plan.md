

## Plan: Remove Background from OmniMarket Logo

Use the Lovable AI image editing model (Gemini) to remove the background from the current logo, then save the transparent PNG back to both asset locations.

### Approach

Create a one-shot backend function that:
1. Takes the current `omnimarket-logo.png` as input
2. Sends it to `google/gemini-2.5-flash-image` with the prompt "Remove the background from this logo, make it fully transparent, keep the logo crisp"
3. Returns the resulting transparent PNG

### Changes

**New edge function: `supabase/functions/remove-bg/index.ts`**
- Accepts the logo image, calls the Gemini image edit API, returns the cleaned image
- One-time utility — can be deleted after use

**After generation:**
- Save the transparent PNG to `src/assets/omnimarket-logo.png` and `public/omnimarket-logo.png`, replacing the current files
- Delete the edge function since it's no longer needed

Single visual change: the logo will render with a transparent background everywhere it appears (nav bar, hero, favicon).

