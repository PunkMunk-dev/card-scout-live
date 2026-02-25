

# Implement OMNIMARKET Cards Institutional Branding

Visual identity only -- no changes to functionality, routing, API calls, data logic, layout structure, or component hierarchy.

## Changes

### 1. Wordmark Component (`src/components/OmniMarketLogo.tsx`) -- NEW FILE
A reusable SVG/React component rendering the two-line wordmark lockup:

```
OMNIMARKET
Cards
```

- "OMNIMARKET": Inter font, weight 800 for "OM" and 600 for "NIMARKET", all caps, letter-spacing 0.02em, color #111111 (light) / #FFFFFF (dark)
- "Cards": Inter font, weight 500, title case, letter-spacing 0.08em, 58% of OMNIMARKET font size, color #1F3C88 (light) / #4C78D0 (dark)
- Line spacing: 0.6x the "O" height
- Tighter kerning on OM, RN, RK, ET pairs via inline letter-spacing spans
- Accepts a `size` prop for scaling (header uses single-line compact mode)

### 2. Header Wordmark (`src/components/TabNavigation.tsx`)
Replace the plain text `<span>OmniMarket Cards</span>` at line 94-96 with an inline version of the wordmark:
- Single-line layout for header: **OMNIMARKET** (black/white) + **Cards** (royal blue) side by side
- Same weight/kerning rules, scaled to fit within the existing h-12 header
- No layout, height, or nav element changes

### 3. Home Page Welcome Text (`src/pages/Index.tsx`)
Replace "Welcome to OmniMarket Cards" (line 204) with the wordmark component in stacked two-line lockup mode above the description text.

### 4. Favicon (`public/favicon.ico`)
Generate a new favicon: "OM" in white (#FFFFFF), Inter 800, centered on deep navy (#0B1F3B) background. No underline. Implemented as an SVG favicon referenced from index.html.

### 5. App Icon Component (`src/components/icons/OmniMarketIcon.tsx`) -- NEW FILE
Standalone app icon component:
- Deep navy background (#0B1F3B), 22% corner radius
- White "OM" text, Inter 800, tight kerning
- Subtle white underline: 6% thickness, 8% offset below baseline
- Flat, no gradients or shadows

### 6. Watermark Component (`src/components/OmniMarketWatermark.tsx`) -- NEW FILE
Small "OM" monogram at 8% opacity for overlay on card images. Bottom-right placement. Used inside `ListingCard.tsx` image container -- added as an absolutely positioned overlay.

### 7. HTML Metadata (`index.html`)
- Update `<title>` to "OMNIMARKET Cards"
- Update og:title and twitter meta tags
- Replace favicon.ico reference with SVG favicon

### 8. Font Import (`src/index.css`)
Update Google Fonts import to include Inter weights 400, 500, 600, 700, and 800 (adding 800 which is currently missing).

### 9. Dark Mode Colors
No CSS variable changes needed -- the wordmark components handle their own dark mode colors via Tailwind's `dark:` prefix:
- OMNIMARKET: `text-[#111111] dark:text-white`
- Cards: `text-[#1F3C88] dark:text-[#4C78D0]`

---

## Files Modified
| File | Change |
|------|--------|
| `src/index.css` | Add Inter weight 800 to font import |
| `src/components/OmniMarketLogo.tsx` | New -- wordmark component |
| `src/components/icons/OmniMarketIcon.tsx` | New -- app icon component |
| `src/components/OmniMarketWatermark.tsx` | New -- watermark overlay component |
| `src/components/TabNavigation.tsx` | Replace brand text with inline wordmark |
| `src/pages/Index.tsx` | Replace welcome heading with wordmark |
| `src/components/ListingCard.tsx` | Add watermark overlay to image container |
| `index.html` | Update title, meta tags, favicon |
| `public/favicon.svg` | New -- SVG favicon |

## What does NOT change
- No routing changes
- No API/data logic changes
- No layout structure or component hierarchy changes
- No header height or nav element position changes
- No functionality changes anywhere

