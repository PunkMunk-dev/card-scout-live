

# Fix: Seed Sports Card Lab Database

## Problem

The `get_published_ruleset_snapshot()` RPC returns empty data because the migration that was supposed to seed the database only included schema changes (adding `compatible_brand_ids` column and updating RPCs) but did NOT include the actual data inserts.

## Solution

Create a new database migration that seeds all the required data:

### 1. Published Ruleset Version
- One `ruleset_versions` row with `status = 'published'` and `published_at = now()`

### 2. Sports (5 rows)
- Football (sort_order 1)
- Basketball (sort_order 2)
- Baseball (sort_order 3)
- Hockey (sort_order 4)
- WNBA (sort_order 5)

### 3. Players (~80 rows across all sports)

**Football (~18):** Saquon Barkley, Jayden Daniels, Travis Hunter, Caleb Williams, Drake Maye, Bo Nix, Marvin Harrison Jr, Malik Nabers, Brock Bowers, Jaxon Smith-Njigba, CJ Stroud, Ladd McConkey, Adonai Mitchell, Rome Odunze, Jahmyr Gibbs, Josh Allen, Patrick Mahomes, Joe Burrow

**Basketball (~18):** Victor Wembanyama, Anthony Edwards, Luka Doncic, Cooper Flagg, Ace Bailey, Dylan Harper, Zaccharie Risacher, Stephon Castle, Reed Sheppard, Donovan Clingan, Ja Morant, Shai Gilgeous-Alexander, Jayson Tatum, LeBron James, Bronny James, Tyrese Maxey, Paolo Banchero, Chet Holmgren

**Baseball (~15):** Jackson Holliday, Elly De La Cruz, Paul Skenes, Shohei Ohtani, Junior Caminero, Jasson Dominguez, Colton Cowser, Wyatt Langford, Evan Carter, Corbin Carroll, Gunnar Henderson, Bobby Witt Jr, Pete Crow-Armstrong, James Wood, Dylan Crews

**Hockey (~18):** Connor Bedard, Macklin Celebrini, Matvei Michkov, Connor McDavid, Ivan Demidov, Cale Makar, Cole Caufield, Matthew Knies, Logan Stankoven, Mason McTavish, Leo Carlsson, Adam Fantilli, Will Smith, Brock Faber, Lane Hutson, Shane Wright, Logan Cooley, Wyatt Johnston

**WNBA (~12):** Caitlin Clark, Angel Reese, Cameron Brink, Paige Bueckers, JuJu Watkins, Aaliyah Edwards, Kamilla Cardoso, Rickea Jackson, Napheesa Collier, Sabrina Ionescu, Breanna Stewart, A'ja Wilson

### 4. Brands (rule_items with kind='brand')

**Football:** Prizm, Donruss Optic, Mosaic, Select, Contenders

**Basketball:** Prizm, Donruss Optic, Mosaic, Select, Contenders, Topps Chrome

**Baseball:** Topps Chrome, Bowman Chrome, Topps, Bowman, Logofractor Chrome

**Hockey:** Upper Deck Series 1, Upper Deck Series 2, SP Authentic, Upper Deck Exclusives

**WNBA:** Prizm, Select

### 5. Traits (rule_items with kind='trait')

**Football/Basketball shared:** Silver Prizm, Numbered, Auto, Color Blast, Downtown, Rookie, Honeycomb, Stained Glass, Die Cut, Tiger Stripe, Mojo, Holo

**Baseball:** Refractor, Numbered, Auto, Rookie, Sapphire, Gold

**Hockey:** Young Guns, Numbered, Auto, Rookie, Exclusives, High Gloss, Outburst

**WNBA:** Silver Prizm, Numbered, Auto, Rookie

Brand compatibility will be set using subqueries (e.g., Silver Prizm is compatible with Prizm brand only).

### 6. Seller Blacklist (~10 entries)
- comc_consignment, probstein123, pwcc_auctions, blowout_cards, dacardworld, cherry_collectibles, steel_city_collectibles, midwest_cards, burbank_sportscards, pristine_auction

## Technical Details

- Single migration file with all INSERTs wrapped in a DO block so brand IDs can be referenced by traits
- Uses variables for the ruleset_version_id and brand UUIDs
- All data inserted in one transaction
- No frontend changes needed

## Files Changed

| File | Change |
|---|---|
| New migration SQL | Seed complete Sports Card Lab dataset |

