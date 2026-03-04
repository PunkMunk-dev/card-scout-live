

## UI Polish Pass: Header, Sidebar, and Brand Cleanup

Pure visual-only changes. No API/search logic changes.

### A) Create `src/components/branding/BrandLockup.tsx`

New component that replaces `OmniLogo` usage in headers:
- Renders `OmniIcon` at **22px** + "OmniMarket" wordmark at **17px** `font-display font-semibold tracking-tight`
- `gap-2` spacing
- Wordmark uses `var(--om-text-0)` in both themes (no more hardcoded white/gray-900 with text-shadow)
- Wrapped in `<Link to="/">`
- Keeps the same `dark` prop for icon filter logic

### B) AppShell header cleanup

**Desktop header (`h-14` stays):**
- Replace `<OmniLogo>` with `<BrandLockup />`
- Section label pill: change from `rounded-md text-xs px-2 py-0.5` → `rounded-full text-[11px] px-2 py-0.5` with shortened labels: "TCG" / "Sports" / "ROI" / "Audit" (drop "Market"/"Top"/"UI")
- Search input: reduce to `h-9` (from `h-10`), submit button also `h-9`
- Theme toggle: standardize to `h-9 w-9 rounded-xl`, icon color `var(--om-text-2)` (was `--om-text-1`)
- WatchlistDropdown button: reduce from `h-11 w-11` to `h-9 w-9` in WatchlistDropdown.tsx
- Right-side cluster: consistent `gap-1.5`

**Mobile header:**
- Replace `<OmniLogo>` with `<BrandLockup />`
- Theme toggle already `h-9 w-9` — just update icon color to `var(--om-text-2)`

### C) Sidebar icon rail cleanup

In `AppSidebar.tsx`:
- Icon size: `h-[18px] w-[18px]` (from `h-4 w-4` = 16px)
- Default icon color via style: `color: var(--om-text-3)`
- Hover style: update `hover:bg-sidebar-accent/50` to include `hover:text-[var(--om-text-1)]`
- Active state: replace `bg-sidebar-accent text-sidebar-primary` with a custom style using `var(--om-bg-2)` background + a `2px` left accent bar via `border-l-2` with `var(--om-accent)` — gives that Linear/premium feel
- Labels: reduce to `text-xs` and color `var(--om-text-2)` when not active
- Watchlist star: icon stays same size, badge styling unchanged

### D) WatchlistDropdown button sizing

In `WatchlistDropdown.tsx`: reduce trigger button from `h-11 w-11` to `h-9 w-9`, icon from `h-5 w-5` to `h-4 w-4`, badge position adjusted.

### E) Files touched

| File | Change |
|------|--------|
| `src/components/branding/BrandLockup.tsx` | **Create** — compact logo+wordmark component |
| `src/components/layout/AppShell.tsx` | Use `BrandLockup`, shrink search/buttons, update pill labels |
| `src/components/layout/AppSidebar.tsx` | Icon sizing, muted colors, accent left-bar active state |
| `src/components/WatchlistDropdown.tsx` | Shrink trigger button to match header sizing |

No changes to: `index.css`, `PageHeader.tsx`, search logic, API calls, routing, or any page components.

