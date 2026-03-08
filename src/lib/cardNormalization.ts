/**
 * Card normalization engine for sports cards.
 * Parses listing titles into structured fields and generates a canonical card_identity_key.
 */

// Brand synonyms for normalization
const BRAND_SYNONYMS: Record<string, string> = {
  'tc': 'Topps Chrome',
  'topps chrome': 'Topps Chrome',
  'prizm': 'Panini Prizm',
  'panini prizm': 'Panini Prizm',
  'optic': 'Donruss Optic',
  'donruss optic': 'Donruss Optic',
  'select': 'Panini Select',
  'panini select': 'Panini Select',
  'mosaic': 'Panini Mosaic',
  'panini mosaic': 'Panini Mosaic',
  'bowman chrome': 'Bowman Chrome',
  'bowman': 'Bowman',
  'topps': 'Topps',
  'donruss': 'Donruss',
  'fleer': 'Fleer',
  'upper deck': 'Upper Deck',
  'ud': 'Upper Deck',
  'hoops': 'NBA Hoops',
  'nba hoops': 'NBA Hoops',
  'contenders': 'Panini Contenders',
  'national treasures': 'National Treasures',
  'nt': 'National Treasures',
  'immaculate': 'Panini Immaculate',
  'spectra': 'Panini Spectra',
  'revolution': 'Panini Revolution',
  'chronicles': 'Panini Chronicles',
  'court kings': 'Panini Court Kings',
  'crown royale': 'Panini Crown Royale',
  'absolute': 'Panini Absolute',
  'elite': 'Donruss Elite',
  'finest': 'Topps Finest',
  'stadium club': 'Topps Stadium Club',
  'heritage': 'Topps Heritage',
  'gypsy queen': 'Topps Gypsy Queen',
  'clearly donruss': 'Clearly Donruss',
  'flux': 'Panini Flux',
  'score': 'Panini Score',
  'certified': 'Panini Certified',
  'illusions': 'Panini Illusions',
  'noir': 'Panini Noir',
  'obsidian': 'Panini Obsidian',
  'origins': 'Panini Origins',
  'photogenic': 'Panini Photogenic',
  'phoenix': 'Panini Phoenix',
  'prestige': 'Panini Prestige',
  'recon': 'Panini Recon',
  'threads': 'Panini Threads',
};

// Grader normalization
const GRADER_PATTERNS: { regex: RegExp; grader: string; gradeGroup: number }[] = [
  { regex: /\bPSA\s*GEM\s*(?:MT|MINT)\s*(\d+)\b/i, grader: 'PSA', gradeGroup: 1 },
  { regex: /\b(?:PSA)\s*(?:GEM\s*(?:MT|MINT)\s*)?(\d+\.?\d*)\b/i, grader: 'PSA', gradeGroup: 1 },
  { regex: /\bBGS\s*(\d+\.?\d*)\b/i, grader: 'BGS', gradeGroup: 1 },
  { regex: /\bSGC\s*(\d+\.?\d*)\b/i, grader: 'SGC', gradeGroup: 1 },
  { regex: /\bCGC\s*(\d+\.?\d*)\b/i, grader: 'CGC', gradeGroup: 1 },
  { regex: /\bGMA\s*(\d+\.?\d*)\b/i, grader: 'GMA', gradeGroup: 1 },
  { regex: /\bHGA\s*(\d+\.?\d*)\b/i, grader: 'HGA', gradeGroup: 1 },
  { regex: /\bCSG\s*(\d+\.?\d*)\b/i, grader: 'CSG', gradeGroup: 1 },
  { regex: /\bMNT\s*(\d+\.?\d*)\b/i, grader: 'MNT', gradeGroup: 1 },
  { regex: /\bACE\s*(\d+\.?\d*)\b/i, grader: 'ACE', gradeGroup: 1 },
];

// Parallel/variation keywords
const PARALLEL_KEYWORDS = [
  'silver', 'gold', 'bronze', 'ruby', 'sapphire', 'emerald', 'diamond',
  'red', 'blue', 'green', 'orange', 'purple', 'pink', 'black', 'white',
  'ice', 'camo', 'holo', 'holographic', 'shimmer', 'scope', 'lazer',
  'mojo', 'refractor', 'xfractor', 'wave', 'hyper', 'neon', 'cracked ice',
  'tie-dye', 'disco', 'galaxy', 'nebula', 'cosmic', 'atomic',
  'peacock', 'tiger', 'leopard', 'zebra', 'snakeskin', 'marble',
  'pulsar', 'velocity', 'fast break', 'courtside', 'fotl',
  'first off the line', 'mega', 'retail', 'hobby', 'choice',
  'color blast', 'downtown', 'case hit', 'ssp', 'sp',
  'numbered', '/10', '/25', '/35', '/49', '/50', '/75', '/99',
  '/100', '/149', '/150', '/199', '/200', '/249', '/250', '/299', '/300',
  '/399', '/499', '/500', '/999',
];

export interface NormalizedCard {
  card_identity_key: string;
  player_name: string | null;
  year: string | null;
  brand: string | null;
  set_name: string | null;
  subset: string | null;
  card_number: string | null;
  parallel: string | null;
  variation: string | null;
  rookie_flag: boolean;
  autograph_flag: boolean;
  memorabilia_flag: boolean;
  grader: string | null;
  grade: string | null;
  raw_or_graded: 'raw' | 'graded';
  confidence: 'exact' | 'high' | 'medium' | 'low';
}

function extractYear(title: string): string | null {
  const match = title.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  return match ? match[1] : null;
}

function extractBrand(title: string): string | null {
  const titleLower = title.toLowerCase();
  const sortedKeys = Object.keys(BRAND_SYNONYMS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (titleLower.includes(key)) {
      return BRAND_SYNONYMS[key];
    }
  }
  return null;
}

function extractCardNumber(title: string): string | null {
  const patterns = [
    /#\s*([A-Z]*-?\d+[A-Z]*)/i,
    /\bNo\.?\s*([A-Z]*-?\d+[A-Z]*)/i,
    /\b([A-Z]{1,4}-\d+[A-Z]?)\b/,
  ];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      const beforeMatch = title.substring(0, match.index || 0);
      if (/\b(?:PSA|BGS|SGC|CGC)\s*$/i.test(beforeMatch)) continue;
      if (match[1] === '10' && /PSA\s*$/i.test(beforeMatch)) continue;
      return match[1].toUpperCase();
    }
  }
  return null;
}

function extractGrading(title: string): { grader: string | null; grade: string | null; raw_or_graded: 'raw' | 'graded' } {
  for (const pattern of GRADER_PATTERNS) {
    const match = title.match(pattern.regex);
    if (match) {
      return { grader: pattern.grader, grade: match[pattern.gradeGroup], raw_or_graded: 'graded' };
    }
  }
  if (/\b(?:graded|slab|slabbed)\b/i.test(title)) {
    return { grader: null, grade: null, raw_or_graded: 'graded' };
  }
  return { grader: null, grade: null, raw_or_graded: 'raw' };
}

function extractParallel(title: string): string | null {
  const titleLower = title.toLowerCase();
  const numberedMatch = titleLower.match(/\/(\d+)\b/);
  if (numberedMatch) {
    const beforeSlash = titleLower.substring(0, titleLower.indexOf('/' + numberedMatch[1]));
    const colorMatch = beforeSlash.match(/(\w+)\s*$/);
    if (colorMatch) {
      const color = colorMatch[1];
      if (PARALLEL_KEYWORDS.some(k => k.toLowerCase() === color)) {
        return `${color} /${numberedMatch[1]}`;
      }
    }
    return `/${numberedMatch[1]}`;
  }

  const found: string[] = [];
  for (const kw of PARALLEL_KEYWORDS) {
    if (kw.startsWith('/')) continue;
    if (titleLower.includes(kw.toLowerCase())) {
      found.push(kw);
    }
  }
  return found.length > 0 ? found[0] : null;
}

function extractFlags(title: string): { rookie: boolean; autograph: boolean; memorabilia: boolean } {
  const titleLower = title.toLowerCase();
  return {
    rookie: /\b(?:rc|rookie)\b/i.test(title),
    autograph: /\b(?:auto|autograph|autographed|on[- ]?card auto)\b/i.test(titleLower),
    memorabilia: /\b(?:patch|jersey|relic|mem|memorabilia|game[- ]?used|game[- ]?worn)\b/i.test(titleLower),
  };
}

function sanitize(s: string | null): string {
  if (!s) return '';
  return s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function buildIdentityKey(fields: {
  year: string | null;
  player_name: string | null;
  brand: string | null;
  set_name: string | null;
  card_number: string | null;
  parallel: string | null;
}): string {
  const parts = [
    fields.year || 'unknown',
    sanitize(fields.player_name) || 'unknown',
    sanitize(fields.brand) || 'unknown',
    sanitize(fields.set_name) || 'base',
    sanitize(fields.card_number) || 'nonum',
    sanitize(fields.parallel) || 'base',
  ];
  return parts.join('_');
}

function computeConfidence(fields: NormalizedCard): NormalizedCard['confidence'] {
  let score = 0;
  if (fields.player_name) score += 2;
  if (fields.year) score += 1;
  if (fields.brand) score += 1;
  if (fields.card_number) score += 2;
  if (fields.set_name) score += 1;

  if (score >= 6) return 'exact';
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * Parse a listing title into structured card fields.
 */
export function normalizeCardTitle(
  title: string,
  context?: { playerName?: string; brand?: string; year?: string }
): NormalizedCard {
  const year = context?.year || extractYear(title);
  const brand = context?.brand ? (BRAND_SYNONYMS[context.brand.toLowerCase()] || context.brand) : extractBrand(title);
  const card_number = extractCardNumber(title);
  const grading = extractGrading(title);
  const parallel = extractParallel(title);
  const flags = extractFlags(title);
  const player_name = context?.playerName || null;
  const set_name = brand;

  const card: NormalizedCard = {
    card_identity_key: '',
    player_name,
    year,
    brand,
    set_name,
    subset: null,
    card_number,
    parallel,
    variation: null,
    rookie_flag: flags.rookie,
    autograph_flag: flags.autograph,
    memorabilia_flag: flags.memorabilia,
    grader: grading.grader,
    grade: grading.grade,
    raw_or_graded: grading.raw_or_graded,
    confidence: 'low',
  };

  card.card_identity_key = buildIdentityKey({
    year, player_name, brand, set_name, card_number, parallel,
  });
  card.confidence = computeConfidence(card);

  return card;
}

/**
 * Expanded exclusion list for junk filtering.
 */
const EXCLUDE_TERMS = [
  'lot', 'bundle', 'reprint', 'custom', 'proxy', 'fake', 'replica',
  'digital', 'mystery', 'break', 'random', 'mixed', 'grab bag',
  'repack', 'repacks', 'pack rip', 'case break', 'group break',
  'spot', 'random team', 'random player',
  'pwe only', 'not a card', 'non-card', 'sticker', 'magnet',
  'poster', 'print', 'photo', 'art card', 'promo card',
  'test print', 'error card',
  'x2', 'x3', 'x4', 'x5', 'x10', 'playset',
];

/**
 * Check if a title should be excluded from sold comps.
 */
export function shouldExcludeFromComps(title: string): boolean {
  const titleLower = title.toLowerCase();
  if (EXCLUDE_TERMS.some(t => titleLower.includes(t))) return true;
  // Multi-card patterns
  if (/\b\d+\s*cards?\b/i.test(title)) return true;
  // Damaged condition
  if (/\b(?:damaged|poor|creased|torn|water\s*damage|bent|trimmed|miscut|off[- ]?center)\b/i.test(title)) return true;
  // Generic "card" only titles (too ambiguous)
  if (/^\s*(card|trading card|sports card)\s*$/i.test(title.trim())) return true;
  return false;
}

// Re-export brand synonyms for edge function use
export { BRAND_SYNONYMS };
