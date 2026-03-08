

## Plan: Fix Auth Bug & Test sync-psa-population

### Problem Found

All three admin-gated edge functions (`sync-psa-population`, `manage-comps`, `verify-psa-cert`) use `userClient.auth.getClaims(token)` which is **not a valid Supabase JS v2 method**. This causes every authenticated request to fail with 401, making the PSA system and comp management completely non-functional.

### Fix

Replace `getClaims` with `getUser()` in all three functions. The pattern change:

```typescript
// BEFORE (broken)
const token = authHeader.replace('Bearer ', '');
const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
if (claimsError || !claimsData?.claims) { ... }
const userId = claimsData.claims.sub as string;

// AFTER (correct)
const { data: { user }, error: userError } = await userClient.auth.getUser();
if (userError || !user) { ... }
const userId = user.id;
```

### Files to edit

1. **`supabase/functions/sync-psa-population/index.ts`** — lines 47-53
2. **`supabase/functions/manage-comps/index.ts`** — lines 27-33
3. **`supabase/functions/verify-psa-cert/index.ts`** — lines 28-32

Each is a 6-line replacement with the same `getUser()` pattern.

### Post-fix test

After deploying, I'll invoke `sync-psa-population` with this sample ingest payload to validate the full pipeline:

```json
{
  "mode": "dry_run",
  "payloads": [{
    "card_identity_key": "test-card-key",
    "source_url": "https://www.psacard.com/pop/basketball-cards/2024/topps-chrome/123456",
    "psa_set_name": "2024 Topps Chrome Basketball",
    "psa_subject": "Cooper Flagg",
    "psa_card_number": "251",
    "grades": [
      { "psa_grade": "10", "population_count": 1234 },
      { "psa_grade": "9", "population_count": 5678 },
      { "psa_grade": "8", "population_count": 2345 }
    ]
  }]
}
```

This will test payload validation and dry-run mode without writing to the database.

### What stays unchanged

- All function logic, sync modes, validation, and RLS policies remain intact
- Only the auth extraction method changes (3 lines per function)

