

# Refresh Sports Lab Player List from Updated CSV

## Summary of Changes

Comparing the uploaded CSV against the current database, here are the differences:

### Football (2 swaps)
- **Remove**: Ashton Jeanty, Travis Hunter
- **Add**: Cam Skattebo, Tyler Loveland

### Basketball (10 additions)
- **Add**: VJ Edgecombe (from main list)
- **Add from "extras" section at bottom of CSV**: Jeremy Sochan, Alperen Sengun, Jalen Green, Jalen Suggs, Evan Mobley, Franz Wagner, Scottie Barnes, Josh Giddey, Chet Holmgren
- (Paolo Banchero and Cade Cunningham already exist, so skip duplicates)

### Hockey (17 additions)
- **Add**: Andrei Kuzmenko, Yaroslav Askarov, Devon Levi, Dustin Wolf, Simon Edvinsson, Marco Kasper, Connor Bedard, Leo Carlsson, Zach Benson, Pavel Mintyukov, Connor Zary, Matthew Poitras, Kevin Korchinski, Logan Cooley, Adam Fantilli, Simon Nemec, Matt Savoie, Cutter Gauthier, Lane Hutson, Logan Stankoven, Jesper Wallstedt, Brad Lambert, Macklin Celebrini, Matvei Michkov, Jett Luchanko, Will Smith, Jonathan Lekkerimaki, Ivan Demidov, Snuggerud
- (Some like Celebrini are already in the DB; only net-new ones will be inserted)

### WNBA (12 additions)
- **Add**: Kelsey Plum, Napheesa Collier, Brittney Griner, Aaliyah Edwards, Hailey Van Lith, Sonia Citron, JuJu Watkins, Hannah Hidalgo, Azzi Fudd, Sarah Strong, Flau'jee Johnson, Olivia Miles

### Baseball (1 note update)
- Jacob Wilson gets note "2025 RC" added (already exists as a player)

### Brands/Traits
- No structural changes needed; existing brands and traits already cover the CSV

## Technical Approach

A single database migration will:
1. Delete all existing players for the ruleset version
2. Re-insert the complete updated list (cleanest approach to avoid partial updates)
3. Update Jacob Wilson's note to "2025 RC"

No code changes are needed -- the app already reads players from the database dynamically.

### Player Counts After Update
| Sport | Current | Updated |
|-------|---------|---------|
| Baseball | 17 | 17 |
| Football | 21 | 21 |
| Basketball | 18 | 27 |
| Hockey | 24 | 44 |
| WNBA | 12 | 24 |
| **Total** | **92** | **133** |

