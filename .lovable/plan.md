
# Fix Light Mode Parity for TCG + Sports Pages

## Problem
Multiple components use hardcoded dark-mode values (`rgba(255,255,255,...)`, `border-white/10`, `hover:bg-white/5`) that become invisible or broken in light mode. The `.om-card` and `.om-command-bar` shadows are also too heavy for light mode.

## Issues Found (by file)

### A. `src/index.css` -- Shadow weight in light mode
- `.om-card:hover` shadow `0 30px 80px rgba(0,0,0,0.55)` is far too harsh for light backgrounds
- `.om-command-bar` shadow `0 20px 60px rgba(0,0,0,0.45)` same issue
- **Fix**: Use `var(--glass-shadow)` instead of hardcoded rgba so light mode gets the softer `rgba(0,0,0,0.08)` value automatically

### B. `src/components/tcg-lab/TerminalCard.tsx`
- Line 84: `borderTop: '1px solid rgba(255,255,255,0.06)'` -- invisible in light mode
- **Fix**: Change to `var(--om-divider)`

### C. `src/components/sports-lab/EbayListingCard.tsx`
- Line 97: `borderTop: '1px solid rgba(255,255,255,0.06)'` -- invisible in light mode
- **Fix**: Change to `var(--om-divider)`

### D. `src/components/tcg-lab/ResultsToolbar.tsx`
- Lines 66, 81: `border-white/10` on SelectTrigger -- invisible in light mode
- Line 71: `hover:bg-white/5` on SelectItem -- invisible in light mode
- **Fix**: Replace `border-white/10` with `border-[var(--om-border-0)]`; replace `hover:bg-white/5` with hover using `var(--om-bg-2)`

### E. `src/components/sports-lab/EbayResultsPanel.tsx`
- Lines 107, 122, 134: `border-white/10` on buttons
- Line 132: `border-white/10` on Alert
- Lines 158, 166: `border-white/10` on SelectTriggers
- **Fix**: All become `border-[var(--om-border-0)]`

### F. `src/components/sports-lab/QueryHeaderDropdown.tsx`
- Lines 29, 105: `border border-white/10` on dropdown trigger buttons
- Lines 45, 134: `borderTop/borderBottom: '1px solid rgba(255,255,255,0.06)'` -- invisible in light mode
- Lines 57, 69: `hover:bg-white/5` -- invisible in light mode
- Line 134: `background: 'rgba(255,255,255,0.02)'` -- invisible in light mode
- **Fix**: Replace with `var(--om-border-0)`, `var(--om-divider)`, and `var(--om-bg-2)` respectively

### G. `src/components/sports-lab/QuerySummaryBar.tsx`
- Line 11: `borderBottom: '1px solid rgba(255,255,255,0.06)'` -- invisible in light mode
- **Fix**: Change to `var(--om-divider)`

### H. `src/components/tcg-lab/TcgHeader.tsx`
- Line 98: `border-white/10` on SheetContent
- **Fix**: Change to `border-[var(--om-border-0)]`

### I. `src/components/sports-lab/QueryHeader.tsx`
- Line 72: `border-white/10` on SheetContent
- **Fix**: Change to `border-[var(--om-border-0)]`

## Summary of Approach

Every hardcoded `rgba(255,255,255,...)` or `border-white/*` is replaced with the corresponding `var(--om-*)` CSS variable that already swaps correctly between light and dark modes. No new tokens needed -- the existing system handles it.

### Files Modified (9 files, styling only)

| File | Changes |
|---|---|
| `src/index.css` | `.om-card:hover` and `.om-command-bar` use `var(--glass-shadow)` for theme-aware shadows |
| `src/components/tcg-lab/TerminalCard.tsx` | border separator uses `var(--om-divider)` |
| `src/components/sports-lab/EbayListingCard.tsx` | border separator uses `var(--om-divider)` |
| `src/components/tcg-lab/ResultsToolbar.tsx` | Replace `border-white/10` and `hover:bg-white/5` with token-based equivalents |
| `src/components/sports-lab/EbayResultsPanel.tsx` | Replace all `border-white/10` with `border-[var(--om-border-0)]` |
| `src/components/sports-lab/QueryHeaderDropdown.tsx` | Replace hardcoded white rgba borders/hovers with tokens |
| `src/components/sports-lab/QuerySummaryBar.tsx` | Idle border uses `var(--om-divider)` |
| `src/components/tcg-lab/TcgHeader.tsx` | Sheet border uses token |
| `src/components/sports-lab/QueryHeader.tsx` | Sheet border uses token |
