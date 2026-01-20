import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= Title Parsing =============

interface CardMetadata {
  year: number | null;
  brand: string | null;
  product: string | null;
  setName: string | null;
  playerName: string | null;
  cardNumber: string | null;
  isRookie: boolean;
  isParallel: boolean;
  isAuto: boolean;
  isNumbered: string | null;
  isRefractor: boolean;
  sport: string | null;
}

// Known brands and their products
const BRANDS: Record<string, string[]> = {
  'Topps': ['Chrome', 'Bowman Chrome', 'Bowman', 'Heritage', 'Stadium Club', 'Finest', 'Update', 'Series 1', 'Series 2', 'Opening Day', 'Archives', 'Allen & Ginter', 'Gypsy Queen', 'Tribute', 'Tier One', 'Dynasty', 'Definitive', 'Luminaries', 'Triple Threads', 'Museum Collection', 'Inception', 'Fire', 'Gold Label', 'Gallery'],
  'Panini': ['Prizm', 'Select', 'Optic', 'Mosaic', 'Donruss', 'Contenders', 'National Treasures', 'Immaculate', 'Flawless', 'One', 'Noir', 'Origins', 'Chronicles', 'Absolute', 'Certified', 'Score', 'Prestige', 'Phoenix', 'Obsidian', 'Spectra', 'Gold Standard', 'Crown Royale', 'Playoff', 'Classics'],
  'Upper Deck': ['SP Authentic', 'SPx', 'The Cup', 'Exquisite', 'Black Diamond', 'Ice', 'MVP', 'Series 1', 'Series 2', 'O-Pee-Chee', 'Artifacts', 'Premier', 'Ultimate Collection', 'Trilogy', 'Allure', 'Credentials', 'Extended Series'],
  'Bowman': ['Chrome', '1st', 'Draft', 'Sapphire', 'Sterling', 'Platinum'],
  'Leaf': ['Trinity', 'Metal', 'Valiant', 'Flash', 'Pro Set'],
  'Fleer': ['Ultra', 'Flair', 'Tradition', 'Showcase', 'Mystique', 'Focus'],
  'Donruss': ['Optic', 'Elite', 'Rated Rookie', 'Clearly', 'Diamond Kings'],
};

// Parallel/refractor keywords
const PARALLEL_KEYWORDS = [
  'refractor', 'prizm', 'parallel', 'rainbow', 'gold', 'silver', 'blue', 'red', 'green', 'orange', 'purple', 'pink', 'black', 'white',
  'atomic', 'shimmer', 'wave', 'holo', 'holographic', 'foil', 'chrome', 'sparkle', 'disco', 'laser', 'pulsar', 'hyper',
  'mojo', 'xfractor', 'superfractor', 'aqua', 'sepia', 'sapphire', 'emerald', 'ruby', 'diamond', 'platinum', 'bronze',
  'neon', 'electric', 'velocity', 'scope', 'camo', 'cracked ice', 'speckle', 'tie-dye', 'marble', 'fluorescent',
  'cosmic', 'galactic', 'nebula', 'stardust', 'astral', 'celestial', 'lunar', 'solar', 'nova', 'supernova',
  '/99', '/75', '/50', '/25', '/15', '/10', '/5', '/1', 'numbered', 'ssp', 'sp', 'case hit', '1/1', 'one of one'
];

// Rookie indicators
const ROOKIE_KEYWORDS = ['rc', 'rookie', 'rated rookie', '1st bowman', 'first bowman', 'prospect', 'draft pick', 'rpa', 'rookie patch auto'];

// Auto indicators  
const AUTO_KEYWORDS = ['auto', 'autograph', 'signed', 'signature', 'on card', 'on-card', 'rpa', 'auto patch', 'patch auto'];

// Refractor-specific keywords
const REFRACTOR_KEYWORDS = ['refractor', 'xfractor', 'superfractor', 'atomic', 'prism', 'wave', 'shimmer', 'chrome'];

// Sport indicators
const SPORT_KEYWORDS: Record<string, string[]> = {
  'baseball': ['mlb', 'baseball', 'topps chrome', 'bowman', 'pitcher', 'outfielder', 'shortstop', 'catcher', 'infielder', 'yankees', 'dodgers', 'red sox', 'cubs', 'braves', 'mets', 'phillies', 'astros', 'rangers', 'padres', 'marlins', 'cardinals', 'giants', 'angels', 'mariners', 'twins', 'rays', 'orioles', 'tigers', 'guardians', 'royals', 'brewers', 'reds', 'pirates', 'nationals', 'rockies', 'diamondbacks', 'athletics', 'white sox'],
  'basketball': ['nba', 'basketball', 'hoops', 'court kings', 'lakers', 'celtics', 'warriors', 'bulls', 'heat', 'nets', 'knicks', 'sixers', 'bucks', 'suns', 'nuggets', 'clippers', 'mavericks', 'grizzlies', 'cavaliers', 'hawks', 'raptors', 'timberwolves', 'pelicans', 'thunder', 'trail blazers', 'jazz', 'spurs', 'kings', 'pistons', 'pacers', 'hornets', 'magic', 'wizards'],
  'football': ['nfl', 'football', 'chiefs', 'eagles', 'bills', 'cowboys', 'niners', '49ers', 'ravens', 'bengals', 'lions', 'dolphins', 'jets', 'patriots', 'chargers', 'raiders', 'broncos', 'steelers', 'browns', 'colts', 'texans', 'titans', 'jaguars', 'commanders', 'giants', 'saints', 'bucs', 'buccaneers', 'falcons', 'panthers', 'seahawks', 'rams', 'cardinals', 'vikings', 'packers', 'bears'],
  'hockey': ['nhl', 'hockey', 'young guns', 'o-pee-chee', 'upper deck', 'bruins', 'maple leafs', 'canadiens', 'rangers', 'blackhawks', 'red wings', 'penguins', 'flyers', 'capitals', 'lightning', 'avalanche', 'oilers', 'flames', 'canucks', 'sharks', 'kings', 'ducks', 'coyotes', 'golden knights', 'kraken', 'blues', 'wild', 'stars', 'predators', 'hurricanes', 'panthers', 'devils', 'islanders', 'senators', 'jets', 'sabres', 'blue jackets'],
  'soccer': ['soccer', 'football', 'premier league', 'la liga', 'bundesliga', 'serie a', 'ligue 1', 'mls', 'fifa', 'uefa', 'world cup', 'manchester', 'liverpool', 'chelsea', 'arsenal', 'barcelona', 'real madrid', 'juventus', 'bayern', 'psg', 'man city', 'man united', 'tottenham'],
  'ufc': ['ufc', 'mma', 'fighter', 'knockdown', 'panini instant', 'topps ufc'],
  'pokemon': ['pokemon', 'pikachu', 'charizard', 'mewtwo', 'trainer', 'psa pokemon', 'vmax', 'vstar', 'ex', 'gx', 'v union', 'rainbow rare', 'secret rare', 'full art', 'illustration rare'],
  'mtg': ['magic', 'mtg', 'gathering', 'planeswalker', 'mana', 'wizards of the coast', 'foil mtg', 'commander', 'modern', 'legacy', 'vintage', 'standard'],
  'yugioh': ['yugioh', 'yu-gi-oh', 'konami', 'duel monsters', 'dark magician', 'blue eyes', 'exodia', 'meta deck', 'ghost rare', 'ultimate rare', 'secret rare', 'starlight rare'],
};

function parseCardTitle(title: string): CardMetadata {
  const lowerTitle = title.toLowerCase();
  const result: CardMetadata = {
    year: null,
    brand: null,
    product: null,
    setName: null,
    playerName: null,
    cardNumber: null,
    isRookie: false,
    isParallel: false,
    isAuto: false,
    isNumbered: null,
    isRefractor: false,
    sport: null,
  };
  
  // Extract year (4-digit number between 1900-2030)
  const yearMatch = title.match(/\b(19[0-9]{2}|20[0-3][0-9])\b/);
  if (yearMatch) {
    result.year = parseInt(yearMatch[1]);
  }
  
  // Detect sport
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some(kw => lowerTitle.includes(kw))) {
      result.sport = sport;
      break;
    }
  }
  
  // Detect brand and product
  for (const [brand, products] of Object.entries(BRANDS)) {
    if (lowerTitle.includes(brand.toLowerCase())) {
      result.brand = brand;
      // Check for specific product
      for (const product of products) {
        if (lowerTitle.includes(product.toLowerCase())) {
          result.product = product;
          break;
        }
      }
      break;
    }
  }
  
  // Detect set name / parallel
  for (const keyword of PARALLEL_KEYWORDS) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      result.isParallel = true;
      if (!result.setName) {
        // Capitalize first letter
        result.setName = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
      break;
    }
  }
  
  // Check for refractor specifically
  result.isRefractor = REFRACTOR_KEYWORDS.some(kw => lowerTitle.includes(kw));
  
  // Detect rookie
  result.isRookie = ROOKIE_KEYWORDS.some(kw => lowerTitle.includes(kw));
  
  // Detect auto
  result.isAuto = AUTO_KEYWORDS.some(kw => lowerTitle.includes(kw));
  
  // Extract numbered (e.g., /99, /25)
  const numberedMatch = title.match(/\/(\d+)/);
  if (numberedMatch) {
    result.isNumbered = numberedMatch[0];
    result.isParallel = true; // Numbered cards are always parallels
  }
  
  // Extract card number (e.g., #150, Card 25)
  const cardNumMatch = title.match(/#\s*(\d+)|card\s*#?\s*(\d+)/i);
  if (cardNumMatch) {
    result.cardNumber = cardNumMatch[1] || cardNumMatch[2];
  }
  
  // If no brand found, try to infer from product keywords
  if (!result.brand) {
    if (lowerTitle.includes('chrome') && !lowerTitle.includes('donruss')) {
      result.brand = 'Topps';
      result.product = 'Chrome';
    } else if (lowerTitle.includes('prizm')) {
      result.brand = 'Panini';
      result.product = 'Prizm';
    } else if (lowerTitle.includes('select')) {
      result.brand = 'Panini';
      result.product = 'Select';
    } else if (lowerTitle.includes('optic')) {
      result.brand = 'Panini';
      result.product = 'Optic';
    } else if (lowerTitle.includes('mosaic')) {
      result.brand = 'Panini';
      result.product = 'Mosaic';
    } else if (lowerTitle.includes('bowman')) {
      result.brand = 'Bowman';
      result.product = lowerTitle.includes('chrome') ? 'Chrome' : '1st';
    }
  }
  
  return result;
}

// ============= Gem Rate Lookup =============

interface GemRateData {
  gemRate: number;
  psa9Rate: number;
  totalGraded: number;
  qcRating: string;
  qcNotes: string;
  source: string;
  matchType: 'exact' | 'product' | 'brand' | 'era' | 'default';
}

async function lookupGemRate(
  supabase: any,
  metadata: CardMetadata
): Promise<GemRateData> {
  const { year, brand, product, setName } = metadata;
  
  // Default fallback rates by era
  const getEraFallback = (cardYear: number | null): GemRateData => {
    if (!cardYear) {
      return {
        gemRate: 35,
        psa9Rate: 30,
        totalGraded: 0,
        qcRating: 'average',
        qcNotes: 'Unable to determine card year - using average estimate',
        source: 'Default',
        matchType: 'default'
      };
    }
    
    if (cardYear >= 2020) {
      return {
        gemRate: 40,
        psa9Rate: 32,
        totalGraded: 0,
        qcRating: 'good',
        qcNotes: 'Modern card - generally good quality control',
        source: 'Era Estimate',
        matchType: 'era'
      };
    } else if (cardYear >= 2010) {
      return {
        gemRate: 38,
        psa9Rate: 33,
        totalGraded: 0,
        qcRating: 'good',
        qcNotes: '2010s card - solid quality control era',
        source: 'Era Estimate',
        matchType: 'era'
      };
    } else if (cardYear >= 2000) {
      return {
        gemRate: 32,
        psa9Rate: 30,
        totalGraded: 0,
        qcRating: 'average',
        qcNotes: '2000s card - variable quality depending on product',
        source: 'Era Estimate',
        matchType: 'era'
      };
    } else if (cardYear >= 1990) {
      return {
        gemRate: 25,
        psa9Rate: 30,
        totalGraded: 0,
        qcRating: 'average',
        qcNotes: 'Junk wax era - high print runs, condition sensitive',
        source: 'Era Estimate',
        matchType: 'era'
      };
    } else if (cardYear >= 1980) {
      return {
        gemRate: 20,
        psa9Rate: 25,
        totalGraded: 0,
        qcRating: 'poor',
        qcNotes: '80s card - often has print defects and centering issues',
        source: 'Era Estimate',
        matchType: 'era'
      };
    } else {
      return {
        gemRate: 12,
        psa9Rate: 18,
        totalGraded: 0,
        qcRating: 'poor',
        qcNotes: 'Vintage card - very difficult to find in gem condition',
        source: 'Era Estimate',
        matchType: 'era'
      };
    }
  };
  
  // If we don't have year or brand, return era fallback
  if (!year && !brand) {
    return getEraFallback(year);
  }
  
  try {
    // Try exact match first (year + brand + product + set)
    if (year && brand && product && setName) {
      const { data: exactMatch } = await supabase
        .from('historical_gem_rates')
        .select('*')
        .eq('year', year)
        .ilike('brand', brand)
        .ilike('product', product)
        .ilike('set_name', setName)
        .maybeSingle();
      
      if (exactMatch) {
        const row = exactMatch as any;
        return {
          gemRate: parseFloat(row.gem_rate) || 35,
          psa9Rate: row.total_graded > 0 
            ? Math.round((row.psa9_count / row.total_graded) * 100)
            : 30,
          totalGraded: row.total_graded || 0,
          qcRating: row.qc_rating || 'average',
          qcNotes: row.qc_notes || '',
          source: row.source || 'Database',
          matchType: 'exact'
        };
      }
    }
    
    // Try year + brand + product
    if (year && brand && product) {
      const { data: productMatch } = await supabase
        .from('historical_gem_rates')
        .select('*')
        .eq('year', year)
        .ilike('brand', brand)
        .ilike('product', product)
        .limit(1)
        .maybeSingle();
      
      if (productMatch) {
        const row = productMatch as any;
        return {
          gemRate: parseFloat(row.gem_rate) || 35,
          psa9Rate: row.total_graded > 0 
            ? Math.round((row.psa9_count / row.total_graded) * 100)
            : 30,
          totalGraded: row.total_graded || 0,
          qcRating: row.qc_rating || 'average',
          qcNotes: row.qc_notes || '',
          source: row.source || 'Database',
          matchType: 'product'
        };
      }
    }
    
    // Try any year with same brand + product
    if (brand && product) {
      const { data: brandProductMatch } = await supabase
        .from('historical_gem_rates')
        .select('*')
        .ilike('brand', brand)
        .ilike('product', product)
        .order('year', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (brandProductMatch) {
        const row = brandProductMatch as any;
        return {
          gemRate: parseFloat(row.gem_rate) || 35,
          psa9Rate: row.total_graded > 0 
            ? Math.round((row.psa9_count / row.total_graded) * 100)
            : 30,
          totalGraded: row.total_graded || 0,
          qcRating: row.qc_rating || 'average',
          qcNotes: `Based on ${row.year} data - ${row.qc_notes || ''}`,
          source: row.source || 'Database',
          matchType: 'brand'
        };
      }
    }
    
    // Fall back to era estimate
    return getEraFallback(year);
    
  } catch (error) {
    console.error('Error looking up gem rate:', error);
    return getEraFallback(year);
  }
}

// ============= Main Handler =============

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { listingId, title } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse the card title
    const metadata = parseCardTitle(title);
    console.log('Parsed metadata:', metadata);
    
    // Look up historical gem rate
    const rateData = await lookupGemRate(supabase, metadata);
    console.log('Rate data:', rateData);
    
    // Apply modifiers based on card specifics
    let adjustedRate = rateData.gemRate;
    const modifiersApplied: string[] = [];
    
    // Parallel cards often grade slightly lower (handling marks from sorting)
    if (metadata.isParallel && !metadata.isRefractor) {
      adjustedRate *= 0.95;
      modifiersApplied.push('Parallel card: -5%');
    }
    
    // Refractors actually tend to grade well
    if (metadata.isRefractor) {
      adjustedRate *= 1.02;
      modifiersApplied.push('Refractor: +2%');
    }
    
    // Low numbered cards may have better QC (hand-numbered, more careful handling)
    if (metadata.isNumbered) {
      const printRun = parseInt(metadata.isNumbered.replace('/', ''));
      if (printRun <= 10) {
        adjustedRate *= 1.08;
        modifiersApplied.push('Ultra low numbered: +8%');
      } else if (printRun <= 25) {
        adjustedRate *= 1.05;
        modifiersApplied.push('Low numbered: +5%');
      } else if (printRun <= 99) {
        adjustedRate *= 1.02;
        modifiersApplied.push('Numbered /99 or less: +2%');
      }
    }
    
    // Auto cards can have issues with the sticker placement
    if (metadata.isAuto) {
      adjustedRate *= 0.92;
      modifiersApplied.push('Autograph (sticker placement risk): -8%');
    }
    
    // Vintage cards have much lower rates
    if (metadata.year && metadata.year < 1980) {
      adjustedRate *= 0.6;
      modifiersApplied.push('Vintage (pre-1980): -40%');
    } else if (metadata.year && metadata.year < 1990) {
      adjustedRate *= 0.8;
      modifiersApplied.push('1980s era: -20%');
    }
    
    // Clamp to reasonable range
    adjustedRate = Math.max(5, Math.min(70, Math.round(adjustedRate)));
    
    // Determine PSA 10 likelihood
    let psa10Likelihood: 'High' | 'Medium' | 'Low';
    if (adjustedRate >= 45) {
      psa10Likelihood = 'High';
    } else if (adjustedRate >= 30) {
      psa10Likelihood = 'Medium';
    } else {
      psa10Likelihood = 'Low';
    }
    
    // Calculate confidence based on data quality
    let confidence: number;
    if (rateData.matchType === 'exact') {
      confidence = 0.95;
    } else if (rateData.matchType === 'product') {
      confidence = 0.85;
    } else if (rateData.matchType === 'brand') {
      confidence = 0.70;
    } else if (rateData.matchType === 'era') {
      confidence = 0.50;
    } else {
      confidence = 0.30;
    }
    
    // Return the gem rate result
    const result = {
      listingId: listingId || 'unknown',
      gemRate: adjustedRate,
      psa10Likelihood,
      psa9Rate: rateData.psa9Rate,
      confidence,
      
      // Historical data
      dataPoints: rateData.totalGraded,
      qcRating: rateData.qcRating,
      qcNotes: rateData.qcNotes,
      source: rateData.source,
      matchType: rateData.matchType,
      
      // Modifiers
      baseRate: rateData.gemRate,
      modifiersApplied,
      
      // Card metadata
      cardMetadata: metadata,
      
      // Analysis info
      analysisMethod: 'historical_data'
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Gem rate error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        gemRate: null,
        psa10Likelihood: 'Low',
        confidence: 0,
        analysisMethod: 'failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
