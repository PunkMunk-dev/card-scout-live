

# Fix "Showing" Summary Bar Rounded Edges

## Problem
The `QuerySummaryBar` (Sports) and `ContextBar` (TCG) that appear below the command bar headers have flat/sharp edges with `borderBottom` lines, inconsistent with the rounded design system used everywhere else.

## Solution
Give both bars `rounded-xl` corners and remove the flat `borderBottom` line. Instead, use a subtle background fill with border all around -- matching the `.om-command-bar` aesthetic -- so they feel like a cohesive rounded element sitting beneath the header.

## Changes

### 1. `src/components/sports-lab/QuerySummaryBar.tsx`
- Both the idle and active states: remove `borderBottom` inline style, add `rounded-xl` class and `border` using `var(--om-border-0)` all around
- Add small vertical margin (`mt-2`) so it visually separates from the command bar above
- Background stays `var(--om-bg-1)` for active, slightly transparent for idle

### 2. `src/components/tcg-lab/ContextBar.tsx`
- Replace `border-b border-border/20 bg-secondary/10` with `rounded-xl` + `border border-[var(--om-border-0)]` + `bg-[var(--om-bg-1)]`
- Wrap in appropriate margin (`mt-2`) for spacing from header

### 3. `src/components/sports-lab/QueryHeader.tsx` (lines 102-105)
- Add padding/margin to the wrapper `div` around `QuerySummaryBar` so the rounded bar has breathing room (e.g., `pt-2`)

### 4. `src/components/tcg-lab/TcgHeader.tsx`
- Same spacing adjustment around where `ContextBar` is rendered, adding `pt-2` if needed

All changes are styling-only. No logic or structure changes.

