

## Plan: Apply Exact Header Spec Polish

Update `AppShell.tsx` to match the provided design tokens exactly. No logic changes.

### Changes to `src/components/layout/AppShell.tsx`

**1. Route pill badge** (line 108-113): Update classes to match spec — add `inline-flex items-center h-6 px-2.5 tracking-tight border` and remove `py-0.5`.

**2. Desktop theme toggle button** (line 138-145): Add `transition-all hover:-translate-y-[1px] hover:bg-[var(--om-bg-1)] hover:text-[var(--om-text-1)]`, remove `om-btn`.

**3. Mobile theme toggle button** (line 78-85): Same hover polish as desktop.

**4. Search input** (line 118-126): Change `h-9` to `h-10`, add `rounded-xl` (full, not `rounded-l-xl`... actually keep split layout). Change `pl-10` stays, `h-9` → `h-10`.

Wait — the spec says `h-10` for search input and button. Currently `h-9`. I'll update to `h-10` for search and submit button, and change submit button padding to `px-4`.

**5. Header container** (line 104): Add responsive padding `px-4 md:px-6 lg:px-8`.

**6. Icon button cluster** (line 137): Change `gap-1.5` to `gap-2`.

### Files

| File | Change |
|------|--------|
| `src/components/layout/AppShell.tsx` | Pill badge classes, button hover states, search sizing, header padding |

