
# Access Gate with Command Bar Lock Screen

## Overview
Create a premium black lock screen with a spotlight-style command bar input. Typing the correct username (`Jordan9697`) and pressing Enter unlocks the full app. Persisted via localStorage.

## Files to Create/Modify

### 1. Create `src/components/auth/AccessGate.tsx`
- Full-screen lock component wrapping the app
- Checks `localStorage.getItem("omni_access") === "granted"` to skip gate
- Allowed username from `import.meta.env.VITE_APP_ACCESS_USERNAME ?? "Jordan9697"`
- On correct entry: sets `omni_access` and `omni_user` in localStorage, renders children
- On wrong entry: shake animation + red border for 500ms + "Access denied" text

**Lock screen visual:**
- Background: `#05060A` with centered radial cyan/blue glow at ~8% opacity
- Faint noise grain overlay at ~3% opacity via inline SVG data URI
- Command bar: 56px tall, 20px rounded, `rgba(255,255,255,0.06)` bg, `rgba(255,255,255,0.10)` border, `backdrop-blur-xl`
- Search icon on left, placeholder "Search... (type access username)"
- Focus ring: blue glow `rgba(10,132,255,0.22)`, border `rgba(10,132,255,0.55)`
- Hover: brighter surface + subtle translateY(-1px)
- Error state: shake keyframe + border `rgba(255,92,122,0.7)`
- Helper text below: "Press Enter to unlock" in `rgba(245,247,255,0.35)`, uppercase, tracking-wide
- Max width 620px desktop, 92vw mobile

### 2. Modify `src/App.tsx`
- Import `AccessGate` and wrap everything inside `<ThemeProvider>` with it:
```
<AccessGate>
  <QueryClientProvider>...all existing content...</QueryClientProvider>
</AccessGate>
```
- No routing or provider changes

### 3. Modify `src/components/TabNavigation.tsx`
- Add a Lock icon button in the desktop nav (right side, near theme toggle)
- On click: removes `omni_access` and `omni_user` from localStorage, navigates to `/`, reloads page
- Tooltip: "Lock"
- Minimal icon-only style matching existing nav buttons

## Technical Details

### Shake animation (inline CSS keyframes in AccessGate)
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
```

### State management in AccessGate
- `useState<boolean>` for `unlocked` (initialized from localStorage check)
- `useState<string>` for input value
- `useState<boolean>` for `error` (triggers shake + red border, auto-clears after 500ms via setTimeout)

### No changes to
- Routing structure
- API calls, search logic, or handlers
- Any existing page components
