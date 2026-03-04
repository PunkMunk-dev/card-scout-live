

## Issue Found: Inverted `dark` Prop Logic

The `OmniLogo` component's color logic is backwards:

- **Caller** (`TabNavigation.tsx` line 106): `dark={theme === 'dark'}` — passes `true` when the app is in dark mode
- **Component** (`OmniLogo.tsx` line 15-16): `dark ? 'text-gray-900' : 'text-white'` — renders **black** text when `dark=true`

This means dark mode gets black text (invisible on dark bg) and light mode gets white text (invisible on light bg).

### Fix

**`src/components/branding/OmniLogo.tsx`** — Swap the conditional:

| Line | Current | Fixed |
|------|---------|-------|
| 15-16 | `dark ? 'text-gray-900' : 'text-white'` | `dark ? 'text-white' : 'text-gray-900'` |
| 15-16 | Shadow when `!dark` | Shadow when `dark` (white text needs it) |

Also fix line 10: `<OmniIcon size={34} dark={!dark} />` — the `!dark` inversion here is suspect too; needs to pass `dark` directly so the icon matches the theme.

One file, three lines.

