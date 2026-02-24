

# Update eBay Secrets and Test Card Finder

## Steps

### 1. Update eBay API Secrets

Update the two existing secrets with the values you provided:

- **EBAY_CLIENT_ID**: `ConnorHu-CardSigh-PRD-fe0563e1b-ec62741c`
- **EBAY_CLIENT_SECRET**: `PRD-e0563e1b72b2-630b-4350-baa4-0c71`

### 2. Test the Connection

After updating secrets, search for **"Charizard VMAX"** in Card Finder to verify:
- The eBay OAuth token exchange succeeds
- Search results are returned
- Cards display correctly in the grid

### 3. Verify Filters

Quick check that the "Ungraded" filter still works correctly with the new credentials.

### Technical Notes

- The `ebay-search` edge function uses these secrets via `Deno.env.get('EBAY_CLIENT_ID')` and `Deno.env.get('EBAY_CLIENT_SECRET')` to obtain an OAuth token from eBay's API.
- No code changes are needed -- only secret values need updating.
- The other secrets (RAPIDAPI_KEY, VITE_XIMILAR_API_TOKEN, XIMILAR_API_TOKEN) are not needed for Card Finder's core eBay search functionality.

