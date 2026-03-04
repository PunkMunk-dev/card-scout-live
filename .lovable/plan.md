

## Plan: Remove Access Gate

Remove the password-protected access gate so the app is immediately accessible without entering a username.

### Changes

**1. `src/App.tsx`** — Remove `AccessGate` wrapper and its import. The app content renders directly.

**2. Delete `src/components/auth/AccessGate.tsx`** — No longer needed.

**3. `src/components/TabNavigation.tsx`** — Check for and remove any "Lock" button that re-engages the gate (references to `omni_access` localStorage).

Three files touched: one edited, one deleted, one checked for lock button cleanup.

