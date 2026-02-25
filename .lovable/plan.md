

# Rename OmniMarket(TM) to OmniMarket Cards(TM)

Simple text replacement in two files:

## Changes

### 1. `index.html`
- Line 7: `<title>OmniMarket™</title>` -> `<title>OmniMarket Cards™</title>`
- Line 11: `og:title` content -> `OmniMarket Cards™`

### 2. `src/components/TabNavigation.tsx`
- Line 65: Header brand text -> `OmniMarket Cards™`

All three occurrences will be updated from "OmniMarket™" to "OmniMarket Cards™".
