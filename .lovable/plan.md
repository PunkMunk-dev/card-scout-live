

## Plan: Theme-Aware Logo (Light/Dark Variants)

### Changes

**1. Copy the uploaded light-mode logo**
- Copy `user-uploads://ChatGPT_Image_Mar_3_2026_07_36_42_PM.png` → `src/assets/omnimarket-logo-light.png`

**2. Update `src/components/TabNavigation.tsx`**
- Import the light logo: `import omniLogoLight from "@/assets/omnimarket-logo-light.png"`
- Use the `theme` value (already available from `useTheme()`) to conditionally render the correct logo
- Dark mode → existing `omnimarket-logo.png` (white/bright logo on dark bg)
- Light mode → new `omnimarket-logo-light.png` (dark logo on light bg)

```tsx
<Link to="/" className="shrink-0 select-none">
  <img
    src={theme === 'dark' ? omniLogo : omniLogoLight}
    alt="OmniMarket"
    className="h-8 w-8 rounded-lg"
  />
</Link>
```

Single file change, 2 lines added.

