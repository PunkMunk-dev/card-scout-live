

# Fix Landing to Full-Bleed Premium Layout

## Problem
The hero section is nested inside a `<main className="container">` wrapper, which constrains it to `max-w-[1400px]` with side padding. The background gradient, glows, and textures are clipped rather than spanning edge-to-edge. The hero height is `min-h-[70vh]` instead of filling the viewport.

## Solution
Restructure the idle/hub block so the hero is a full-bleed `<section>` outside the container, with background layers at full width and content centered inside a `max-w-[1400px]` inner wrapper. Market tiles move into their own section below.

## Changes (1 file: `src/pages/Index.tsx`, styling only)

### A. Pull hero out of `<main className="container">`
- The idle state (lines 240-318) currently renders inside `<main className="container py-6">`, which applies `max-width` and padding to everything including backgrounds
- Restructure so the idle block renders as a sibling **outside** the `<main>` container, or conditionally skip the container wrapper when showing the hero

### B. Hero section -- full-bleed with proper height
Replace the current `<div className="relative overflow-hidden" style={{...}}>` with:
```
<section className="relative w-full min-h-[100vh] flex items-center overflow-hidden"
  style={{ background: 'linear-gradient(...)' }}>
```
- `w-full` + no `max-w` = edge-to-edge background
- `min-h-[100vh]` + `flex items-center` = vertically centered, full viewport
- All background layers (spotlight, grid texture, mosaic, glows) stay as absolute children of this section -- they already use `absolute inset-0` so they'll naturally fill the full width

### C. Content wrapper inside hero
The existing `<div className="relative mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">` stays as-is for the hero text content. Add `z-10` to ensure it layers above backgrounds.

Change inner flex container from `min-h-[70vh]` to just vertical padding (`py-16 md:py-24`) since the parent section now handles the `min-h-[100vh]` + centering.

### D. Market tiles -- separate section
Move market tiles out of the hero section into their own `<section>`:
```
<section className="relative w-full" style={{ background: 'var(--om-bg-0)' }}>
  <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20">
    {/* tiles grid */}
  </div>
</section>
```
This creates a clean section break without overlap effects.

### E. Conditional container for search results
When `hasSearched` is true, the `<main className="container py-6">` still wraps search results as before -- no change there. Only the idle/hub state breaks out of the container.

### Technical Detail
The return statement restructure:
- Wrap the outer `<div>` to conditionally render: if idle (no search), render the full-bleed hero sections directly; if searched, render the existing `<main className="container">` with results
- The toolbar (`hasSearched && ...`) stays at the top unchanged

