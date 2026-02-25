

# Premium Dark Landing Redesign — Apple x Hard Rock x Glass

Complete visual overhaul of the landing hub with tokenized design system, glass morphism, PSA background texture, and micro-interaction polish. Three files modified; zero functional changes.

## Files Modified

1. `src/index.css` — Design tokens + glass morphism class
2. `tailwind.config.ts` — Color tokens + animation keyframes
3. `src/pages/Index.tsx` — Hub section (lines 328-505) restyled
4. `src/components/TabNavigation.tsx` — Nav matched to dark system

## A) Design System Tokens

### A1) CSS Variables (`src/index.css`)

Add new `:root` block with landing-specific tokens:

```css
:root {
  /* Landing neutrals */
  --om-bg-0: #0B0F16;
  --om-bg-1: #0E1420;
  --om-bg-2: #121A28;
  --om-bg-3: #162033;
  --om-text-0: #F5F7FF;
  --om-text-1: #B8C0D4;
  --om-text-2: #7F8AA3;
  --om-text-3: #59647C;
  --om-border-0: rgba(255,255,255,0.08);
  --om-border-1: rgba(255,255,255,0.12);
  --om-divider: rgba(255,255,255,0.06);
  --om-accent: #00B9FF;
  --om-focus-ring: rgba(0,185,255,0.18);
  --om-success: #2EE59D;
  --om-warning: #FFCC66;
  --om-danger: #FF5C7A;

  /* Glass morphism */
  --glass-fill: rgba(255,255,255,0.06);
  --glass-border: rgba(255,255,255,0.12);
  --glass-highlight: rgba(255,255,255,0.08);
  --glass-shadow: rgba(0,0,0,0.55);
  --glass-blur: 20px;
}
```

### A2) Glass Panel Class (`src/index.css`)

Add `.glass-panel` in `@layer components`:

```css
.glass-panel {
  position: relative;
  background: var(--glass-fill);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: 28px;
  box-shadow:
    0 20px 60px var(--glass-shadow),
    inset 0 1px 0 var(--glass-highlight);
  transition:
    transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.glass-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(135deg,
    rgba(255,255,255,0.12) 0%,
    rgba(255,255,255,0.05) 35%,
    rgba(255,255,255,0.00) 70%);
  opacity: 0.35;
}
.glass-panel:hover {
  transform: translateY(-2px);
  box-shadow:
    0 30px 80px rgba(0,0,0,0.65),
    inset 0 1px 0 rgba(255,255,255,0.12);
}
```

### A3) Tailwind Config Extensions (`tailwind.config.ts`)

Add to `theme.extend.colors`:

```ts
om: {
  bg: { 0: '#0B0F16', 1: '#0E1420', 2: '#121A28', 3: '#162033' },
  text: { 0: '#F5F7FF', 1: '#B8C0D4', 2: '#7F8AA3', 3: '#59647C' },
  accent: '#00B9FF',
}
```

Add to `keyframes`:

```ts
marquee: {
  '0%': { transform: 'translateX(0)' },
  '100%': { transform: 'translateX(-50%)' },
}
```

Add to `animation`:

```ts
marquee: 'marquee 22s linear infinite',
```

## B) Landing Hub Redesign (`src/pages/Index.tsx`, lines 328-505)

### B1) Background System

Replace the current outer wrapper with:

- Base: `bg-[#0B0F16]` with gradient `from-[#0B0F16] via-[#0E1420] to-[#0B0F16]`
- Grid texture at `opacity-[0.04]`, `backgroundSize: '32px 32px'`
- Ambient glows: `w-[600px] h-[600px]` with `blur-[140px]` (cyan top-left, blue bottom-right)
- PSA card image as ultra-blurred background layer: `blur-[28px] opacity-[0.07] scale-110` with radial gradient mask fading edges. Copy `user-uploads://image-2.png` to `src/assets/psa-mosaic.jpg` and import it

### B2) Hero Grid

```
grid grid-cols-1 lg:grid-cols-12 gap-16 items-center min-h-[85vh]
```

**Left column** (`lg:col-span-6`):
- Wordmark: `text-[11px] font-medium uppercase tracking-[0.30em] text-[#B8C0D4]` — "OMNIMARKET CARDS"
- Headline: `text-[36px] md:text-[48px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#F5F7FF] max-w-[540px]`
- Subtext: `text-[14px] leading-[1.55] text-[#7F8AA3] max-w-[480px]`
- No chips (removed for declutter)
- Two CTAs only:
  - Primary: `bg-white text-[#0B0F16] rounded-xl h-11 px-6 font-medium` with hover `translateY(-1px)` + shadow, active `scale(0.98)`
  - Secondary: `bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] text-[#F5F7FF] rounded-xl h-11 px-6` with hover `bg-[rgba(255,255,255,0.10)]`

**Right column** (`lg:col-span-6`) — Uses `.glass-panel` class:

A) **Trending ticker**: `animate-marquee` (22s), pause on hover via `hover:[animation-play-state:paused]` on container. Pills: `bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.10)] backdrop-blur-md rounded-full px-3 py-1 text-[11px] text-[#B8C0D4]`

B) **Stats**: `grid grid-cols-3 gap-3 mt-6`. Each card: `rounded-2xl bg-[#0E1420]/60 border border-[rgba(255,255,255,0.10)] p-4 text-center`. Number: `text-[24px] font-semibold text-[#F5F7FF]`. Label: `text-[11px] uppercase tracking-[0.30em] text-[#7F8AA3]`

C) **Featured** (3 max): `grid grid-cols-3 gap-4 mt-6`. Cards: `rounded-xl bg-[#0E1420]/70 border border-[rgba(255,255,255,0.10)] overflow-hidden` with hover `translateY(-2px)` + border brighten + glow shadow. Price: `text-[14px] font-semibold text-[#F5F7FF]`. Title: `text-[11px] text-[#7F8AA3]`

### B3) Market Tiles

Below hero, `mt-24`:
- `grid grid-cols-1 md:grid-cols-2 gap-8`
- Each tile: `rounded-3xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] p-10` with hover `bg-[rgba(255,255,255,0.10)]` + `translateY(-2px)`
- Title: `text-[16px] font-semibold text-[#F5F7FF]`
- Description: `text-[14px] text-[#7F8AA3]`
- Button: `bg-white text-[#0B0F16] rounded-xl h-10 px-5 font-medium`

### B4) Removed

- Inline `<style>` marquee keyframes (moved to Tailwind config)
- Chips row
- Any standalone sections outside hero

## C) Nav Update (`src/components/TabNavigation.tsx`)

Match the dark system on desktop:

- Header: `bg-[#0B0F16]/90 backdrop-blur-xl border-b border-[rgba(255,255,255,0.08)]`
- Wordmark: `text-[#F5F7FF]` / `text-[#7F8AA3]`
- Tabs inactive: `text-[#7F8AA3] hover:text-[#B8C0D4] hover:bg-[rgba(255,255,255,0.06)]`
- Tabs active: `text-[#F5F7FF] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)]`
- Search input: `bg-[#121A28] border border-[rgba(255,255,255,0.10)] text-[#F5F7FF] placeholder:text-[#59647C] focus:ring-2 focus:ring-[rgba(0,185,255,0.18)]`
- Remove shadow from header

Mobile bottom bar stays unchanged (uses existing card/border tokens).

## D) Micro-interactions (applied inline in Index.tsx)

- All transitions: `duration-200` with `cubic-bezier(0.16, 1, 0.3, 1)` via inline style or Tailwind `ease-out`
- Buttons: hover `translateY(-1px)`, active `scale(0.98)` via `hover:-translate-y-px active:scale-[0.98]`
- Cards: hover `translateY(-2px)` via `hover:-translate-y-0.5`
- Marquee: `hover:[animation-play-state:paused]` on overflow container
- Focus ring: `focus:ring-2 focus:ring-[rgba(0,185,255,0.18)]` on interactive elements

## What Does NOT Change

- Lines 1-327 of Index.tsx (all logic, state, handlers, API calls)
- Routes, search behavior, watchlist
- Mobile bottom nav structure
- Any other page files

