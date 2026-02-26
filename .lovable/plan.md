
# Unify Watchlist Icon Across All Tabs

## Goal
Make the watchlist icon consistent everywhere, matching the TCG Market (TerminalCard) style: a **Star** icon in a dark pill (`bg-black/50 backdrop-blur-sm`), using `var(--om-accent)` cyan color with `fill-current` when selected, and `text-white/70` when unselected.

## Current State
| Location | Icon | Selected Color | Container |
|---|---|---|---|
| TCG Market (TerminalCard) | Star | `var(--om-accent)` cyan + fill | `bg-black/50 backdrop-blur-sm` |
| Sports Market (WatchlistStar) | Star | `text-yellow-500` + fill | `bg-black/50 backdrop-blur-sm` |
| Card Finder / Index (ListingCard) | Heart | `text-primary` + fill | `bg-background/70 backdrop-blur-sm` |

## Target
All three match TerminalCard: **Star icon**, `var(--om-accent)` when active, `bg-black/50 backdrop-blur-sm` container.

## Changes

### 1. `src/components/sports-lab/WatchlistStar.tsx`
- Change selected color from `text-yellow-500` to `text-[var(--om-accent)]`
- Update container to match: `w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors`
- Update unselected: `text-white/70 hover:text-white`
- Icon size: `h-3.5 w-3.5` to match

### 2. `src/components/ListingCard.tsx`
- Replace `Heart` import with `Star` from lucide-react (remove Heart import)
- Change the button container from `bg-background/70` to `bg-black/50 backdrop-blur-sm` with `w-7 h-7 flex items-center justify-center rounded-full`
- Selected: `text-[var(--om-accent)]` instead of `text-primary`
- Unselected: `text-white/70 hover:text-white`
- Replace `<Heart>` with `<Star className="h-3.5 w-3.5" />` with `fill-current` when active
