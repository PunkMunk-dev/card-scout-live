

# Finish Sports Card Lab -- Seed Database

## Current State

The Sports Card Lab is fully ported and functionally identical to the standalone version (minus auth/Stripe, which was intentionally deferred). All frontend components, hooks, edge functions, and types are in place.

**The only reason it shows "No published ruleset available" is because the database tables are empty.** Once we seed the data, it will work exactly like the standalone app.

## What's Missing

1. **Schema fix**: The `rule_items` table needs a `compatible_brand_ids` column (UUID array) so traits can be filtered by which brands they apply to
2. **RPC update**: The `get_published_ruleset_snapshot()` function needs to return `compatible_brand_ids` in its output
3. **Seed data**: A complete published ruleset with sports, players, brands, traits, and seller blacklist entries

## Implementation

### Single Database Migration

One migration that does everything:

1. **Add column**: `ALTER TABLE rule_items ADD COLUMN compatible_brand_ids uuid[] NOT NULL DEFAULT '{}'`

2. **Update RPC**: Recreate `get_published_ruleset_snapshot()` to include `compatible_brand_ids` in the rule_items JSON output

3. **Seed a published ruleset** with:
   - 1 published ruleset version
   - 5 sports: Football, Basketball, Baseball, Hockey, WNBA
   - ~80 players across all sports (current hot rookies and stars)
   - Brands per sport (Prizm, Topps Chrome, Bowman, etc.)
   - Traits per sport (Numbered, Auto, Silver Prizm, Rookie, etc.) with brand compatibility mappings
   - ~10 seller blacklist patterns (comc, probstein123, etc.)

### No Frontend Changes

Zero code changes needed. The frontend is complete and will work as soon as the database has data.

## Result

After this migration, the Sports Card Lab tab will be fully functional -- select a sport, pick a player, choose a brand, and see live eBay listings with PSA 10 guides, gem rates, and profit calculations. Exactly like the standalone app, minus the paywall.

