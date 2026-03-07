

## Plan: OmniMarket Brand Identity & Landing Page

### Overview
Transform OmniMarket from a card-trading tool into a venture-grade AI marketplace search engine brand with SVG orb logos, new color system, and a Perplexity-style landing page.

### 1. SVG Orb Logo System
**New file: `src/components/branding/OmniOrb.tsx`**
- Create 10 SVG orb explorations as React components using radial gradients, blur filters, and animated glows
- Primary orb: "OmniCore" — minimal sphere with inner neural glow, AI Teal (#00E0C6) → Neural Blue (#3B82F6) gradient
- Export a configurable `<OmniOrb variant={1-10} size={} />` component
- Each variant uses pure SVG (scalable, no images): radial gradients, feGaussianBlur, animated opacity pulses

### 2. Favicon & App Icon
**Edit: `public/favicon.svg`** — Replace M monogram with minimal orb SVG
**New file: `public/app-icon.svg`** — 1024px version with black background + glowing orb

### 3. Updated Brand Components
**Edit: `src/components/branding/OmniIcon.tsx`** — Replace PNG import with `<OmniOrb />` SVG component
**Edit: `src/components/branding/OmniLogo.tsx`** — Use new orb + updated wordmark (Inter SemiBold, slightly tracked "OMNIMARKET")
**Edit: `src/components/branding/BrandLockup.tsx`** — Use new orb, update wordmark to uppercase tracked style

### 4. Color System Update
**Edit: `src/index.css`** — Add new brand tokens:
```css
--om-accent: #00E0C6;        /* AI Teal (replaces #00B9FF) */
--om-accent-blue: #3B82F6;   /* Neural Blue */
--om-slate: #1F2937;
--om-gradient: linear-gradient(135deg, #00E0C6, #3B82F6);
```
Keep existing `om-bg-*` dark surfaces (#0B0B0C base). Light mode tokens remain functional.

### 5. Landing Page
**New file: `src/components/landing/LandingHero.tsx`**
- Full-viewport hero with centered orb logo (animated ambient glow)
- Headline: "Search every marketplace on the internet."
- Subheadline: "OmniMarket uses AI to find the best listings across every trusted marketplace in real time."
- Large floating search bar (rounded-full, glassmorphism, centered)
- Example search pills below input
- Marketplace trust badges row (Amazon, eBay, Etsy, StockX, Mercari, Walmart) as subtle gray logos/text

**New file: `src/components/landing/MarketplaceBadges.tsx`**
- Horizontal row of marketplace names in muted text with subtle separators

**New file: `src/components/landing/ProductCard.tsx`**
- Apple Store-style product card: image, price, marketplace source badge, seller rating dots, "View" CTA
- Glassmorphism card with 16px radius, soft shadow

**New file: `src/components/landing/FeaturesSection.tsx`**
- 3-column grid: "AI-Powered Search", "Every Marketplace", "Real-Time Results"
- Each card with icon, title, description

### 6. Landing Page Route
**Edit: `src/pages/Index.tsx`**
- When no search is active (dashboard mode), replace the current quick-start cards with the new `LandingHero` + `FeaturesSection`
- Search results mode stays as-is

### 7. Typography
**Edit: `src/index.css`** — Ensure Inter is loaded (already present). Add wordmark utility class:
```css
.om-wordmark {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

### Files to create
- `src/components/branding/OmniOrb.tsx` (10 SVG orb variants)
- `src/components/landing/LandingHero.tsx`
- `src/components/landing/MarketplaceBadges.tsx`
- `src/components/landing/ProductCard.tsx`
- `src/components/landing/FeaturesSection.tsx`

### Files to edit
- `public/favicon.svg`
- `src/components/branding/OmniIcon.tsx`
- `src/components/branding/OmniLogo.tsx`
- `src/components/branding/BrandLockup.tsx`
- `src/index.css`
- `src/pages/Index.tsx`

### Preserved
- All existing search/results functionality untouched
- AppShell, sidebar, mobile tab bar structure preserved
- TCG, Sports, ROI pages unaffected
- Existing om-* token system extended (not replaced)

