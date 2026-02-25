

# Add Unit Tests for cleanListingTitle

## Overview
Create a test file for the `cleanListingTitle` and `extractSearchQuery` functions, covering the recently added behaviors: RC preservation, `#`-to-`/` conversion, and variant word preservation (Version, Ver).

## New File: `src/lib/cleanTitle.test.ts`

Pure unit tests using Vitest (already configured). No UI rendering needed, so no additional dependencies required.

### Test Cases

**RC preservation**
- Input: `"ANTHONY EDWARDS 2020 Prizm Basketball RC!"` -- assert output contains `RC`
- Input: `"Luka Doncic Rookie Card RC #280"` -- assert `RC` present, `Rookie Card` stripped

**Card number # to / conversion**
- Input: `"Prizm #256 Silver"` -- assert output contains `/256`, not `#256`
- Input: `"Card #45 Refractor"` -- assert `/45` present

**Variant words preserved (Version, Ver)**
- Input: `"Green Version Prizm"` -- assert `Version` preserved
- Input: `"Holo Ver Charizard"` -- assert `Ver` preserved

**Product identifiers preserved**
- Input with `PRIZM`, `CHROME`, `OPTIC` -- assert all remain in output

**Existing stripping still works**
- Grading labels (`PSA 10`) stripped
- Sport categories (`Basketball`) stripped
- Filler words (`lot`, `repack`) stripped
- Emojis stripped

**extractSearchQuery**
- Verify it caps output at `maxWords` and uses cleaned title

### Technical Details
- File location: `src/lib/cleanTitle.test.ts`
- Uses `import { describe, it, expect } from "vitest"`
- Imports `cleanListingTitle` and `extractSearchQuery` from `./cleanTitle`
- No mocks or DOM needed -- pure string transformation tests

