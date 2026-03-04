

## Plan: Theme-aware OmniMarket Wordmark Color

**`src/components/branding/OmniLogo.tsx`** — Make the wordmark color respond to the `dark` prop:

- **Dark mode**: White text with existing shadow
- **Light mode**: Black text (`#111827`), no shadow needed

| Prop | Dark | Light |
|------|------|-------|
| Color | `text-white` | `text-gray-900` |
| Shadow | `0 1px 6px rgba(0,0,0,0.35)` | none |

Uses the existing `dark` prop already passed into the component. One file, minimal changes.

