

# Replace Favicon with Black Dot

## Approach
Create a simple SVG favicon of a black filled circle and update `index.html` to reference it.

## Changes

### 1. Create `public/favicon.svg`
A minimal SVG file containing a black circle on a transparent background.

### 2. Update `index.html`
Replace the existing favicon reference with:
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
```

Two files touched, no logic changes.
