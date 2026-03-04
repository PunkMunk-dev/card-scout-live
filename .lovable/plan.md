

## Plan: Replace Wordmark with Logo Icon

### Changes

**1. Copy the uploaded logo to the project**
- Copy `user-uploads://image-10.png` → `src/assets/omnimarket-logo.png`

**2. Update `src/components/TabNavigation.tsx`**
- Import the logo: `import omniLogo from "@/assets/omnimarket-logo.png"`
- Replace the `<Link>` containing the two `<span>` elements ("OmniMarket" + "Cards") with a single `<img>` tag using the logo, sized at `h-8 w-8` with `rounded-lg`
- Keep the `<Link to="/">` wrapper so clicking the logo still navigates home

Before:
```tsx
<Link to="/" className="flex flex-col leading-none select-none shrink-0">
  <span className="...">OmniMarket</span>
  <span className="...">Cards</span>
</Link>
```

After:
```tsx
<Link to="/" className="shrink-0 select-none">
  <img src={omniLogo} alt="OmniMarket" className="h-8 w-8 rounded-lg" />
</Link>
```

Single file change, ~3 lines modified.

