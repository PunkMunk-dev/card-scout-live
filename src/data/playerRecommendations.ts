// Player recommendations data extracted from MLP Top 100+ Players spreadsheet
// This is the authoritative source for player-based search recommendations

export interface PlayerRecommendation {
  player: string;
  sport: "baseball" | "football" | "basketball" | "hockey" | "wnba";
  searches: string[];
}

// Brand → Trait mappings derived from the spreadsheet
const BRAND_TRAITS = {
  // Baseball
  "Topps": ["Rookie", "SP", "SSP", "Variation", "Color"],
  "Topps Chrome": ["Rookie", "Refractor", "Auto", "Color", "Sapphire"],
  "Bowman Chrome": ["1st", "Auto", "Refractor", "Color"],
  "Bowman": ["1st", "Auto", "Prospect"],
  "Cosmic Chrome": ["Refractor", "Color"],
  
  // Football
  "Prizm": ["Rookie", "Silver", "Auto", "Numbered", "Color Blast"],
  "Optic": ["Rated Rookie", "Holo", "Auto", "Numbered", "Color"],
  "Select": ["Concourse", "Premier Level", "Field Level", "Club Level", "Courtside", "Die Cut", "Tri Color", "Zebra", "Tiger Stripe"],
  "Mosaic": ["Rookie", "Prizm", "Color", "Numbered"],
  "Donruss": ["Rated Rookie", "Downtown", "Auto"],
  "Contenders": ["Rookie Ticket", "Auto", "Numbered"],
  
  // Basketball - same brands as football with similar traits
  
  // Hockey
  "Upper Deck": ["Young Guns", "Rookie", "Exclusives", "High Gloss"],
  "SP Authentic": ["Future Watch", "Auto", "Numbered"],
} as const;

// Helper function to generate search strings
function generateSearches(player: string, brands: string[], traits: string[][]): string[] {
  const searches: string[] = [];
  brands.forEach((brand, idx) => {
    const brandTraits = traits[idx] || [];
    brandTraits.forEach(trait => {
      searches.push(`${player} ${brand} ${trait}`);
    });
  });
  return searches.slice(0, 6); // Max 6 recommendations
}

export const PLAYER_RECOMMENDATIONS: PlayerRecommendation[] = [
  // ===== BASEBALL =====
  {
    player: "Shohei Ohtani",
    sport: "baseball",
    searches: [
      "Shohei Ohtani Topps Chrome Rookie Auto",
      "Shohei Ohtani Topps Chrome Sapphire",
      "Shohei Ohtani Bowman Chrome 1st Auto",
      "Shohei Ohtani Topps Chrome Refractor",
      "Shohei Ohtani Topps SP Variation",
      "Shohei Ohtani Cosmic Chrome Color"
    ]
  },
  {
    player: "Aaron Judge",
    sport: "baseball",
    searches: [
      "Aaron Judge Topps Chrome Rookie",
      "Aaron Judge Topps Chrome Auto",
      "Aaron Judge Bowman Chrome 1st",
      "Aaron Judge Topps Chrome Refractor",
      "Aaron Judge Topps SP Variation"
    ]
  },
  {
    player: "Bobby Witt",
    sport: "baseball",
    searches: [
      "Bobby Witt Jr Topps Chrome Rookie Auto",
      "Bobby Witt Jr Bowman Chrome 1st Auto",
      "Bobby Witt Jr Topps Chrome Refractor",
      "Bobby Witt Jr Topps SP Variation",
      "Bobby Witt Jr Topps Chrome Color"
    ]
  },
  {
    player: "Julio Rodriguez",
    sport: "baseball",
    searches: [
      "Julio Rodriguez Topps Chrome Rookie",
      "Julio Rodriguez Bowman Chrome 1st Auto",
      "Julio Rodriguez Topps Chrome Refractor",
      "Julio Rodriguez Topps SP",
      "Julio Rodriguez Topps Chrome Auto"
    ]
  },
  {
    player: "Jasson Dominguez",
    sport: "baseball",
    searches: [
      "Jasson Dominguez Bowman Chrome 1st Auto",
      "Jasson Dominguez Topps Chrome Rookie",
      "Jasson Dominguez Bowman Chrome Refractor",
      "Jasson Dominguez Topps Chrome Auto",
      "Jasson Dominguez Bowman 1st"
    ]
  },
  {
    player: "Elly De La Cruz",
    sport: "baseball",
    searches: [
      "Elly De La Cruz Topps Chrome Rookie",
      "Elly De La Cruz Bowman Chrome 1st Auto",
      "Elly De La Cruz Topps Chrome Refractor",
      "Elly De La Cruz Topps Chrome Auto Numbered",
      "Elly De La Cruz Topps SP Variation"
    ]
  },
  {
    player: "Jackson Holliday",
    sport: "baseball",
    searches: [
      "Jackson Holliday Bowman Chrome 1st Auto",
      "Jackson Holliday Topps Chrome Rookie SP",
      "Jackson Holliday Cosmic Chrome Refractor",
      "Jackson Holliday Sapphire Chrome",
      "Jackson Holliday Bowman Chrome Refractor"
    ]
  },
  {
    player: "James Wood",
    sport: "baseball",
    searches: [
      "James Wood Bowman Chrome 1st Auto",
      "James Wood Topps Chrome Rookie",
      "James Wood Bowman Chrome Refractor",
      "James Wood Topps SP"
    ]
  },
  {
    player: "Jackson Chourio",
    sport: "baseball",
    searches: [
      "Jackson Chourio Topps Chrome Rookie",
      "Jackson Chourio Bowman Chrome 1st Auto",
      "Jackson Chourio Topps Chrome Refractor",
      "Jackson Chourio Topps Chrome Auto"
    ]
  },
  {
    player: "Walker Jenkins",
    sport: "baseball",
    searches: [
      "Walker Jenkins Bowman Chrome 1st Auto",
      "Walker Jenkins Bowman Chrome Refractor",
      "Walker Jenkins Bowman 1st"
    ]
  },
  {
    player: "Jackson Merrill",
    sport: "baseball",
    searches: [
      "Jackson Merrill Topps Chrome Rookie",
      "Jackson Merrill Bowman Chrome 1st Auto",
      "Jackson Merrill Topps Chrome Refractor",
      "Jackson Merrill Topps Chrome Auto"
    ]
  },
  {
    player: "Junior Caminero",
    sport: "baseball",
    searches: [
      "Junior Caminero Topps Chrome Rookie",
      "Junior Caminero Bowman Chrome 1st Auto",
      "Junior Caminero Topps Chrome Refractor"
    ]
  },
  {
    player: "Max Clark",
    sport: "baseball",
    searches: [
      "Max Clark Bowman Chrome 1st Auto",
      "Max Clark Bowman Chrome Refractor",
      "Max Clark Bowman 1st"
    ]
  },
  {
    player: "Jacob Wilson",
    sport: "baseball",
    searches: [
      "Jacob Wilson Bowman Chrome 1st Auto",
      "Jacob Wilson Topps Chrome Rookie",
      "Jacob Wilson Bowman Chrome Refractor"
    ]
  },
  {
    player: "Aidan Miller",
    sport: "baseball",
    searches: [
      "Aidan Miller Bowman Chrome 1st Auto",
      "Aidan Miller Bowman Chrome Refractor",
      "Aidan Miller Bowman 1st"
    ]
  },
  {
    player: "Paul Skenes",
    sport: "baseball",
    searches: [
      "Paul Skenes Topps Chrome Rookie",
      "Paul Skenes Bowman Chrome 1st Auto",
      "Paul Skenes Topps Chrome Refractor",
      "Paul Skenes Topps Chrome Auto"
    ]
  },
  {
    player: "Justin Crawford",
    sport: "baseball",
    searches: [
      "Justin Crawford Bowman Chrome 1st Auto",
      "Justin Crawford Bowman Chrome Refractor",
      "Justin Crawford Bowman 1st"
    ]
  },

  // ===== FOOTBALL =====
  {
    player: "Patrick Mahomes",
    sport: "football",
    searches: [
      "Patrick Mahomes Prizm Rookie Auto",
      "Patrick Mahomes Prizm Silver Rookie",
      "Patrick Mahomes Optic Rated Rookie",
      "Patrick Mahomes Select Field Level",
      "Patrick Mahomes Prizm Color Numbered",
      "Patrick Mahomes Mosaic Rookie"
    ]
  },
  {
    player: "Josh Allen",
    sport: "football",
    searches: [
      "Josh Allen Prizm Rookie Auto",
      "Josh Allen Prizm Silver Rookie",
      "Josh Allen Optic Rated Rookie",
      "Josh Allen Select Field Level",
      "Josh Allen Prizm Numbered Color"
    ]
  },
  {
    player: "Justin Herbert",
    sport: "football",
    searches: [
      "Justin Herbert Prizm Rookie Auto",
      "Justin Herbert Prizm Silver",
      "Justin Herbert Prizm Color Blast",
      "Justin Herbert Optic Rated Rookie",
      "Justin Herbert Select Field Level"
    ]
  },
  {
    player: "Justin Jefferson",
    sport: "football",
    searches: [
      "Justin Jefferson Prizm Rookie Auto",
      "Justin Jefferson Optic Rated Rookie",
      "Justin Jefferson Donruss Downtown",
      "Justin Jefferson Prizm Silver",
      "Justin Jefferson Select Numbered"
    ]
  },
  {
    player: "Ja'Marr Chase",
    sport: "football",
    searches: [
      "Jamarr Chase Prizm Rookie Auto",
      "Jamarr Chase Optic Rated Rookie Holo",
      "Jamarr Chase Donruss Downtown",
      "Jamarr Chase Prizm Silver",
      "Jamarr Chase Select Numbered"
    ]
  },
  {
    player: "Brock Purdy",
    sport: "football",
    searches: [
      "Brock Purdy Prizm Rookie Auto",
      "Brock Purdy Mosaic Rookie",
      "Brock Purdy Prizm Silver",
      "Brock Purdy Optic Rated Rookie",
      "Brock Purdy Select Genesis"
    ]
  },
  {
    player: "CJ Stroud",
    sport: "football",
    searches: [
      "CJ Stroud Prizm Rookie Auto",
      "CJ Stroud Prizm Silver",
      "CJ Stroud Select Genesis",
      "CJ Stroud Optic Rated Rookie",
      "CJ Stroud Prizm Numbered Color"
    ]
  },
  {
    player: "Jalen Hurts",
    sport: "football",
    searches: [
      "Jalen Hurts Prizm Rookie Auto",
      "Jalen Hurts Mosaic Honeycomb",
      "Jalen Hurts Prizm Stained Glass",
      "Jalen Hurts Optic Rated Rookie",
      "Jalen Hurts Select Field Level"
    ]
  },
  {
    player: "Bijan Robinson",
    sport: "football",
    searches: [
      "Bijan Robinson Prizm Rookie Auto",
      "Bijan Robinson Select Field Level",
      "Bijan Robinson Prizm Silver",
      "Bijan Robinson Optic Rated Rookie",
      "Bijan Robinson Prizm Numbered"
    ]
  },
  {
    player: "Puka Nacua",
    sport: "football",
    searches: [
      "Puka Nacua Prizm Rookie Auto",
      "Puka Nacua Prizm Silver",
      "Puka Nacua Select Field Level",
      "Puka Nacua Optic Rated Rookie",
      "Puka Nacua Prizm Numbered"
    ]
  },
  {
    player: "Jaylen Gibbs",
    sport: "football",
    searches: [
      "Jahmyr Gibbs Prizm Rookie Auto",
      "Jahmyr Gibbs Select Premier Level",
      "Jahmyr Gibbs Prizm Silver",
      "Jahmyr Gibbs Optic Rated Rookie"
    ]
  },
  {
    player: "La'Darius Porta",
    sport: "football",
    searches: [
      "LaPorta Prizm Rookie Auto",
      "LaPorta Select Field Level",
      "LaPorta Prizm Silver",
      "LaPorta Optic Rated Rookie"
    ]
  },
  {
    player: "Michael Penix",
    sport: "football",
    searches: [
      "Michael Penix Prizm Rookie Auto",
      "Michael Penix Select Die Cut",
      "Michael Penix Prizm Tri Color",
      "Michael Penix Select Zebra Tiger Stripe",
      "Michael Penix Optic Rated Rookie"
    ]
  },
  {
    player: "Brock Bowers",
    sport: "football",
    searches: [
      "Brock Bowers Prizm Rookie Auto",
      "Brock Bowers Contenders Rookie Ticket Auto",
      "Brock Bowers Prizm Silver",
      "Brock Bowers Select Field Level"
    ]
  },
  {
    player: "Brian Thomas Jr",
    sport: "football",
    searches: [
      "Brian Thomas Jr Prizm Rookie Auto",
      "Brian Thomas Jr Optic Contenders",
      "Brian Thomas Jr Prizm Silver",
      "Brian Thomas Jr Select Field Level"
    ]
  },
  {
    player: "Jayden Daniels",
    sport: "football",
    searches: [
      "Jayden Daniels Prizm Rookie Auto",
      "Jayden Daniels Prizm Silver Numbered",
      "Jayden Daniels Optic Rated Rookie",
      "Jayden Daniels Select Color",
      "Jayden Daniels Mosaic Rookie"
    ]
  },
  {
    player: "Drake Maye",
    sport: "football",
    searches: [
      "Drake Maye Prizm Rookie Auto",
      "Drake Maye Prizm Silver",
      "Drake Maye Optic Rated Rookie",
      "Drake Maye Select Field Level"
    ]
  },
  {
    player: "Bo Nix",
    sport: "football",
    searches: [
      "Bo Nix Prizm Rookie Auto",
      "Bo Nix Prizm Silver",
      "Bo Nix Optic Rated Rookie",
      "Bo Nix Select Field Level"
    ]
  },
  {
    player: "Ladd McConkey",
    sport: "football",
    searches: [
      "Ladd McConkey Prizm Rookie Auto",
      "Ladd McConkey Prizm Silver",
      "Ladd McConkey Optic Rated Rookie",
      "Ladd McConkey Select Field Level"
    ]
  },
  {
    player: "Caleb Williams",
    sport: "football",
    searches: [
      "Caleb Williams Prizm Rookie Auto",
      "Caleb Williams Prizm Silver",
      "Caleb Williams Optic Rated Rookie",
      "Caleb Williams Select Field Level",
      "Caleb Williams Mosaic Rookie"
    ]
  },
  {
    player: "Marvin Harrison Jr",
    sport: "football",
    searches: [
      "Marvin Harrison Jr Prizm Rookie Auto",
      "Marvin Harrison Jr Prizm Silver",
      "Marvin Harrison Jr Optic Rated Rookie",
      "Marvin Harrison Jr Select Field Level",
      "Marvin Harrison Jr Donruss Downtown"
    ]
  },

  // ===== BASKETBALL =====
  {
    player: "Stephen Curry",
    sport: "basketball",
    searches: [
      "Stephen Curry Prizm Rookie Auto",
      "Stephen Curry Prizm Silver Numbered",
      "Stephen Curry Select Courtside",
      "Stephen Curry Mosaic Color",
      "Stephen Curry Optic Holo"
    ]
  },
  {
    player: "Austin Reaves",
    sport: "basketball",
    searches: [
      "Austin Reaves Prizm Rookie Auto",
      "Austin Reaves Prizm Color Blast",
      "Austin Reaves Select Courtside",
      "Austin Reaves Optic Rated Rookie",
      "Austin Reaves Prizm Silver"
    ]
  },
  {
    player: "Chet Holmgren",
    sport: "basketball",
    searches: [
      "Chet Holmgren Prizm Rookie Auto",
      "Chet Holmgren Optic Rated Rookie",
      "Chet Holmgren Select Courtside",
      "Chet Holmgren Prizm Silver Numbered",
      "Chet Holmgren Mosaic Color"
    ]
  },
  {
    player: "Paolo Banchero",
    sport: "basketball",
    searches: [
      "Paolo Banchero Prizm Rookie Auto",
      "Paolo Banchero Optic Rated Rookie Holo",
      "Paolo Banchero Donruss Downtown",
      "Paolo Banchero Select Courtside",
      "Paolo Banchero Prizm Silver Numbered"
    ]
  },
  {
    player: "Luka Doncic",
    sport: "basketball",
    searches: [
      "Luka Doncic Prizm Rookie Auto",
      "Luka Doncic Mosaic Color",
      "Luka Doncic Select Courtside",
      "Luka Doncic Prizm Silver",
      "Luka Doncic Optic Rated Rookie"
    ]
  },
  {
    player: "LeBron James",
    sport: "basketball",
    searches: [
      "LeBron James Topps Chrome Rookie",
      "LeBron James Prizm Silver Numbered",
      "LeBron James Select Genesis",
      "LeBron James Mosaic Color",
      "LeBron James Prizm Gold"
    ]
  },
  {
    player: "Anthony Edwards",
    sport: "basketball",
    searches: [
      "Anthony Edwards Prizm Rookie Auto",
      "Anthony Edwards Mosaic Honeycomb",
      "Anthony Edwards Prizm Stained Glass",
      "Anthony Edwards Select Courtside",
      "Anthony Edwards Optic Rated Rookie"
    ]
  },
  {
    player: "Victor Wembanyama",
    sport: "basketball",
    searches: [
      "Wembanyama Prizm Rookie Auto",
      "Wembanyama Select Concourse",
      "Wembanyama Prizm Silver",
      "Wembanyama Optic Rated Rookie",
      "Wembanyama Mosaic Rookie"
    ]
  },
  {
    player: "Wemby",
    sport: "basketball",
    searches: [
      "Wembanyama Prizm Rookie Auto",
      "Wembanyama Select Concourse",
      "Wembanyama Prizm Silver",
      "Wembanyama Optic Rated Rookie",
      "Wembanyama Mosaic Rookie"
    ]
  },
  {
    player: "Brandon Miller",
    sport: "basketball",
    searches: [
      "Brandon Miller Prizm Rookie Auto",
      "Brandon Miller Select Premier Level",
      "Brandon Miller Prizm Silver",
      "Brandon Miller Optic Rated Rookie"
    ]
  },
  {
    player: "Amen Thompson",
    sport: "basketball",
    searches: [
      "Amen Thompson Prizm Rookie Auto",
      "Amen Thompson Select Die Cut",
      "Amen Thompson Prizm Tri Color",
      "Amen Thompson Select Tiger Stripe",
      "Amen Thompson Optic Rated Rookie"
    ]
  },
  {
    player: "Scoot Henderson",
    sport: "basketball",
    searches: [
      "Scoot Henderson Prizm Rookie Auto",
      "Scoot Henderson Select Tiger Stripe",
      "Scoot Henderson Prizm Silver",
      "Scoot Henderson Optic Rated Rookie"
    ]
  },
  {
    player: "Brandin Podziemski",
    sport: "basketball",
    searches: [
      "Brandin Podziemski Prizm Rookie Auto",
      "Brandin Podziemski Contenders Rookie Ticket",
      "Brandin Podziemski Prizm Silver",
      "Brandin Podziemski Select Courtside"
    ]
  },
  {
    player: "Stephon Castle",
    sport: "basketball",
    searches: [
      "Stephon Castle Prizm Rookie Auto",
      "Stephon Castle Optic Contenders",
      "Stephon Castle Prizm Silver",
      "Stephon Castle Select Courtside"
    ]
  },
  {
    player: "Bronny James",
    sport: "basketball",
    searches: [
      "Bronny James Prizm Rookie Auto",
      "Bronny James Prizm Silver Numbered",
      "Bronny James Optic Rated Rookie",
      "Bronny James Select Color",
      "Bronny James Mosaic Rookie"
    ]
  },
  {
    player: "Cooper Flagg",
    sport: "basketball",
    searches: [
      "Cooper Flagg Bowman Chrome 1st Auto",
      "Cooper Flagg Bowman Chrome Refractor",
      "Cooper Flagg Bowman 1st"
    ]
  },
  {
    player: "Zach Edey",
    sport: "basketball",
    searches: [
      "Zach Edey Prizm Rookie Auto",
      "Zach Edey Prizm Silver",
      "Zach Edey Optic Rated Rookie",
      "Zach Edey Select Courtside"
    ]
  },
  {
    player: "Donovan Clingan",
    sport: "basketball",
    searches: [
      "Donovan Clingan Prizm Rookie Auto",
      "Donovan Clingan Prizm Silver",
      "Donovan Clingan Optic Rated Rookie",
      "Donovan Clingan Select Courtside"
    ]
  },
  {
    player: "Matas Buzelis",
    sport: "basketball",
    searches: [
      "Matas Buzelis Prizm Rookie Auto",
      "Matas Buzelis Prizm Silver",
      "Matas Buzelis Optic Rated Rookie",
      "Matas Buzelis Select Courtside"
    ]
  },
  {
    player: "Reed Sheppard",
    sport: "basketball",
    searches: [
      "Reed Sheppard Prizm Rookie Auto",
      "Reed Sheppard Prizm Silver",
      "Reed Sheppard Optic Rated Rookie",
      "Reed Sheppard Select Courtside"
    ]
  },
  {
    player: "Cade Cunningham",
    sport: "basketball",
    searches: [
      "Cade Cunningham Prizm Rookie Auto",
      "Cade Cunningham Prizm Silver",
      "Cade Cunningham Select Courtside",
      "Cade Cunningham Contenders Rookie Ticket",
      "Cade Cunningham Mosaic Numbered"
    ]
  },
  {
    player: "Jeremy Sochan",
    sport: "basketball",
    searches: [
      "Jeremy Sochan Prizm Rookie Auto",
      "Jeremy Sochan Contenders Rookie Ticket",
      "Jeremy Sochan Mosaic Rookie",
      "Jeremy Sochan Select Courtside"
    ]
  },
  {
    player: "Alperen Sengun",
    sport: "basketball",
    searches: [
      "Alperen Sengun Prizm Rookie Auto",
      "Alperen Sengun Contenders Rookie Ticket",
      "Alperen Sengun Mosaic Rookie",
      "Alperen Sengun Select Courtside"
    ]
  },
  {
    player: "Jalen Green",
    sport: "basketball",
    searches: [
      "Jalen Green Prizm Rookie Auto",
      "Jalen Green Contenders Rookie Ticket",
      "Jalen Green Mosaic Rookie",
      "Jalen Green Select Courtside"
    ]
  },
  {
    player: "Evan Mobley",
    sport: "basketball",
    searches: [
      "Evan Mobley Prizm Rookie Auto",
      "Evan Mobley Contenders Rookie Ticket",
      "Evan Mobley Mosaic Rookie",
      "Evan Mobley Select Courtside"
    ]
  },
  {
    player: "Franz Wagner",
    sport: "basketball",
    searches: [
      "Franz Wagner Prizm Rookie Auto",
      "Franz Wagner Contenders Rookie Ticket",
      "Franz Wagner Mosaic Rookie",
      "Franz Wagner Select Courtside"
    ]
  },
  {
    player: "Scottie Barnes",
    sport: "basketball",
    searches: [
      "Scottie Barnes Prizm Rookie Auto",
      "Scottie Barnes Contenders Rookie Ticket",
      "Scottie Barnes Mosaic Rookie",
      "Scottie Barnes Select Courtside"
    ]
  },

  // ===== HOCKEY =====
  {
    player: "Connor McDavid",
    sport: "hockey",
    searches: [
      "Connor McDavid Young Guns Rookie",
      "Connor McDavid SP Authentic Future Watch Auto",
      "Connor McDavid Upper Deck Exclusives",
      "Connor McDavid High Gloss",
      "Connor McDavid Upper Deck Rookie"
    ]
  },
  {
    player: "Cale Makar",
    sport: "hockey",
    searches: [
      "Cale Makar Young Guns Rookie",
      "Cale Makar SP Authentic Future Watch Auto",
      "Cale Makar Upper Deck Exclusives",
      "Cale Makar Upper Deck High Gloss"
    ]
  },
  {
    player: "Igor Shesterkin",
    sport: "hockey",
    searches: [
      "Igor Shesterkin Young Guns Rookie",
      "Igor Shesterkin SP Authentic Future Watch Auto",
      "Igor Shesterkin Upper Deck Exclusives"
    ]
  },
  {
    player: "Jack Hughes",
    sport: "hockey",
    searches: [
      "Jack Hughes Young Guns Rookie",
      "Jack Hughes SP Authentic Future Watch Auto",
      "Jack Hughes Upper Deck Exclusives",
      "Jack Hughes Upper Deck Outburst"
    ]
  },
  {
    player: "Nick Suzuki",
    sport: "hockey",
    searches: [
      "Nick Suzuki Young Guns Rookie",
      "Nick Suzuki SP Authentic Future Watch Auto",
      "Nick Suzuki Upper Deck Canvas"
    ]
  },
  {
    player: "Jason Robertson",
    sport: "hockey",
    searches: [
      "Jason Robertson Young Guns Rookie",
      "Jason Robertson SP Authentic Future Watch Auto",
      "Jason Robertson Upper Deck Exclusives"
    ]
  },
  {
    player: "Kirill Kaprizov",
    sport: "hockey",
    searches: [
      "Kirill Kaprizov Young Guns Rookie",
      "Kirill Kaprizov SP Authentic Future Watch Auto",
      "Kirill Kaprizov Upper Deck Exclusives"
    ]
  },
  {
    player: "Cole Caufield",
    sport: "hockey",
    searches: [
      "Cole Caufield Young Guns Rookie",
      "Cole Caufield SP Authentic Future Watch Auto",
      "Cole Caufield Upper Deck Exclusives"
    ]
  },
  {
    player: "Jeremy Swayman",
    sport: "hockey",
    searches: [
      "Jeremy Swayman Young Guns Rookie",
      "Jeremy Swayman SP Authentic Future Watch Auto",
      "Jeremy Swayman Upper Deck Exclusives"
    ]
  },
  {
    player: "Moritz Seider",
    sport: "hockey",
    searches: [
      "Moritz Seider Young Guns Rookie",
      "Moritz Seider SP Authentic Future Watch Auto",
      "Moritz Seider Upper Deck Exclusives"
    ]
  },
  {
    player: "Trevor Zegras",
    sport: "hockey",
    searches: [
      "Trevor Zegras Young Guns Rookie",
      "Trevor Zegras SP Authentic Future Watch Auto",
      "Trevor Zegras Upper Deck Exclusives"
    ]
  },
  {
    player: "Matty Beniers",
    sport: "hockey",
    searches: [
      "Matty Beniers Young Guns Rookie",
      "Matty Beniers SP Authentic Future Watch Auto",
      "Matty Beniers Upper Deck Exclusives"
    ]
  },
  {
    player: "Connor Bedard",
    sport: "hockey",
    searches: [
      "Connor Bedard Young Guns Rookie",
      "Connor Bedard SP Authentic Future Watch Auto",
      "Connor Bedard Upper Deck Exclusives",
      "Connor Bedard Upper Deck High Gloss"
    ]
  },
  {
    player: "Lane Hutson",
    sport: "hockey",
    searches: [
      "Lane Hutson Young Guns Rookie",
      "Lane Hutson SP Authentic Future Watch Auto",
      "Lane Hutson Upper Deck Exclusives"
    ]
  },
  {
    player: "Logan Stankoven",
    sport: "hockey",
    searches: [
      "Logan Stankoven Young Guns Rookie",
      "Logan Stankoven SP Authentic Future Watch Auto",
      "Logan Stankoven Upper Deck Exclusives"
    ]
  },
  {
    player: "Macklin Celebrini",
    sport: "hockey",
    searches: [
      "Macklin Celebrini Young Guns Rookie",
      "Macklin Celebrini SP Authentic Future Watch Auto",
      "Macklin Celebrini Upper Deck Exclusives"
    ]
  },
  {
    player: "Matvei Michkov",
    sport: "hockey",
    searches: [
      "Matvei Michkov Young Guns Rookie",
      "Matvei Michkov SP Authentic Future Watch Auto",
      "Matvei Michkov Upper Deck Exclusives"
    ]
  },
  {
    player: "Leo Carlsson",
    sport: "hockey",
    searches: [
      "Leo Carlsson Young Guns Rookie",
      "Leo Carlsson SP Authentic Future Watch Auto",
      "Leo Carlsson Upper Deck Exclusives"
    ]
  },
  {
    player: "Adam Fantilli",
    sport: "hockey",
    searches: [
      "Adam Fantilli Young Guns Rookie",
      "Adam Fantilli SP Authentic Future Watch Auto",
      "Adam Fantilli Upper Deck Exclusives"
    ]
  },
  {
    player: "Logan Cooley",
    sport: "hockey",
    searches: [
      "Logan Cooley Young Guns Rookie",
      "Logan Cooley SP Authentic Future Watch Auto",
      "Logan Cooley Upper Deck Exclusives"
    ]
  },

  // ===== WNBA =====
  {
    player: "Caitlin Clark",
    sport: "wnba",
    searches: [
      "Caitlin Clark Prizm Rookie Auto",
      "Caitlin Clark Prizm Silver",
      "Caitlin Clark Select Courtside",
      "Caitlin Clark Optic Rated Rookie",
      "Caitlin Clark Origins Rookie"
    ]
  },
  {
    player: "Angel Reese",
    sport: "wnba",
    searches: [
      "Angel Reese Prizm Rookie Auto",
      "Angel Reese Prizm Silver",
      "Angel Reese Select Courtside",
      "Angel Reese Optic Rated Rookie"
    ]
  },
  {
    player: "Cameron Brink",
    sport: "wnba",
    searches: [
      "Cameron Brink Prizm Rookie Auto",
      "Cameron Brink Prizm Silver",
      "Cameron Brink Select Courtside",
      "Cameron Brink Optic Rated Rookie"
    ]
  },
  {
    player: "Breanna Stewart",
    sport: "wnba",
    searches: [
      "Breanna Stewart Prizm Auto",
      "Breanna Stewart Prizm Silver",
      "Breanna Stewart Select Courtside",
      "Breanna Stewart Optic Numbered"
    ]
  },
  {
    player: "A'ja Wilson",
    sport: "wnba",
    searches: [
      "Aja Wilson Prizm Auto",
      "Aja Wilson Prizm Silver",
      "Aja Wilson Select Courtside",
      "Aja Wilson Optic Numbered"
    ]
  },
  {
    player: "Sabrina Ionescu",
    sport: "wnba",
    searches: [
      "Sabrina Ionescu Prizm Rookie Auto",
      "Sabrina Ionescu Prizm Silver",
      "Sabrina Ionescu Select Courtside",
      "Sabrina Ionescu Optic Rated Rookie"
    ]
  },
  {
    player: "Kelsey Plum",
    sport: "wnba",
    searches: [
      "Kelsey Plum Prizm Auto",
      "Kelsey Plum Prizm Silver",
      "Kelsey Plum Select Courtside",
      "Kelsey Plum Optic Numbered"
    ]
  },
  {
    player: "Paige Bueckers",
    sport: "wnba",
    searches: [
      "Paige Bueckers Bowman U Rookie Auto",
      "Paige Bueckers Bowman U Chrome",
      "Paige Bueckers Prizm Draft Picks",
      "Paige Bueckers Select Courtside"
    ]
  },
  {
    player: "JuJu Watkins",
    sport: "wnba",
    searches: [
      "JuJu Watkins Bowman U Rookie Auto",
      "JuJu Watkins Bowman U Chrome",
      "JuJu Watkins Prizm Draft Picks"
    ]
  },
  {
    player: "Hannah Hidalgo",
    sport: "wnba",
    searches: [
      "Hannah Hidalgo Bowman U Rookie Auto",
      "Hannah Hidalgo Bowman U Chrome",
      "Hannah Hidalgo Prizm Draft Picks"
    ]
  }
];

// Normalize player name for matching (lowercase, remove special chars)
function normalizePlayerName(name: string): string {
  return name.toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Find player recommendations matching a search query
export function findPlayerRecommendations(query: string): PlayerRecommendation | null {
  const normalizedQuery = normalizePlayerName(query);
  
  // Try to find a player match in the query
  for (const rec of PLAYER_RECOMMENDATIONS) {
    const normalizedPlayer = normalizePlayerName(rec.player);
    
    // Check if query contains the player name
    if (normalizedQuery.includes(normalizedPlayer) || 
        normalizedPlayer.includes(normalizedQuery)) {
      return rec;
    }
    
    // Check for partial matches (first + last name)
    const playerParts = normalizedPlayer.split(" ");
    const queryParts = normalizedQuery.split(" ");
    
    // Match if both first and last name appear in query
    if (playerParts.length >= 2) {
      const firstName = playerParts[0];
      const lastName = playerParts[playerParts.length - 1];
      
      if (queryParts.includes(firstName) && queryParts.includes(lastName)) {
        return rec;
      }
      
      // Also match just last name if it's distinctive enough (>4 chars)
      if (lastName.length > 4 && queryParts.includes(lastName)) {
        return rec;
      }
    }
  }
  
  return null;
}
