export interface CardIdentity {
  player: string | null;
  year: string | null;
  set: string | null;
  cardNumber: string | null;
  variation: string | null;
  language: string | null;
}

const KNOWN_SETS = [
  'prizm', 'select', 'optic', 'mosaic', 'chrome', 'bowman', 'topps', 'donruss',
  'panini', 'fleer', 'upper deck', 'hoops', 'obsidian', 'contenders', 'immaculate',
  'national treasures', 'spectra', 'noir', 'revolution', 'origins',
  // TCG
  'base set', 'jungle', 'fossil', 'team rocket', 'neo', 'ex', 'gx', 'vmax', 'vstar',
  'scarlet violet', 'sword shield', 'sun moon', 'xy', 'black white',
  'evolving skies', 'brilliant stars', '151', 'obsidian flames', 'paldea evolved',
  'paradox rift', 'temporal forces', 'twilight masquerade', 'surging sparks',
  'op01', 'op02', 'op03', 'op04', 'op05', 'op06', 'op07', 'op08', 'op09',
  'romance dawn', 'paramount war', 'pillars of strength',
];

const VARIATIONS = [
  'refractor', 'holo', 'holographic', 'alt art', 'alternate art', 'full art',
  'illustration rare', 'special art rare', 'sar', 'sir', 'art rare',
  'silver', 'gold', 'red', 'blue', 'green', 'orange', 'purple', 'pink',
  'mojo', 'cracked ice', 'wave', 'scope', 'shimmer',
  'rookie', 'rc', '1st edition', 'first edition',
  'auto', 'autograph', 'patch', 'memorabilia', 'relic', 'jersey',
];

export function normalizeCardIdentity(title: string): CardIdentity {
  const t = title.toLowerCase().replace(/[^\w\s\/\-#]/g, ' ').replace(/\s+/g, ' ').trim();

  // Year: 4-digit starting with 19 or 20
  const yearMatch = t.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : null;

  // Card number: #123, /123, No. 123
  const numMatch = t.match(/(?:#|no\.?\s*|\/\s*)(\d{1,4})\b/);
  const cardNumber = numMatch ? numMatch[1] : null;

  // Set
  let set: string | null = null;
  for (const s of KNOWN_SETS) {
    if (t.includes(s)) {
      set = s;
      break;
    }
  }

  // Variation
  let variation: string | null = null;
  for (const v of VARIATIONS) {
    if (t.includes(v)) {
      variation = v;
      break;
    }
  }

  // Language
  let language: string | null = null;
  if (/\bjapanese\b|\bjpn\b/.test(t)) language = 'japanese';
  else if (/\benglish\b|\beng\b/.test(t)) language = 'english';

  // Player/character: strip known tokens and take the remaining long words
  let cleaned = t;
  // Remove year, card number, set, variation, grading terms, common noise
  if (year) cleaned = cleaned.replace(year, '');
  if (set) cleaned = cleaned.replace(set, '');
  if (variation) cleaned = cleaned.replace(variation, '');
  cleaned = cleaned
    .replace(/\b(psa|bgs|sgc|cgc|graded|gem\s*mint|slab|raw|nm|mint|near mint)\b/g, '')
    .replace(/\b(card|cards|trading|tcg|pokemon|pokémon|one piece|baseball|basketball|football|soccer|hockey)\b/g, '')
    .replace(/\b(topps|panini|bowman|upper deck|donruss|fleer|hoops)\b/g, '')
    .replace(/#\d+/g, '')
    .replace(/\b\d{1,2}\b/g, '') // remove small numbers
    .replace(/\s+/g, ' ')
    .trim();

  // Take first 3–5 meaningful words as player name
  const words = cleaned.split(' ').filter(w => w.length > 1);
  const player = words.slice(0, 4).join(' ') || null;

  return { player, year, set, cardNumber, variation, language };
}

export function buildPsa10Query(identity: CardIdentity): string {
  const parts: string[] = [];
  if (identity.player) parts.push(identity.player);
  if (identity.year) parts.push(identity.year);
  if (identity.set) parts.push(identity.set);
  if (identity.cardNumber) parts.push(`#${identity.cardNumber}`);
  if (identity.variation) parts.push(identity.variation);
  parts.push('PSA 10');
  return parts.join(' ');
}
