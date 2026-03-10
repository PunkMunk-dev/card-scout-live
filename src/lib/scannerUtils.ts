import type { NormalizedListing, OpportunityStrength, ClusterConfidence, MarketMode } from '@/types/scanner';

// ─── Total Cost ─────────────────────────────────────────
export function deriveTotalCost(price: number | null, shipping: number | null): number | null {
  if (price === null) return null;
  return price + (shipping ?? 0);
}

// ─── Token extraction ───────────────────────────────────
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'for', 'to', 'with',
  'is', 'it', 'at', 'by', 'on', 'this', 'that', 'from', 'new', 'card', 'cards',
]);

const KEEP_TERMS = new Set([
  'psa', 'bgs', 'sgc', 'cgc', 'holo', 'auto', 'rookie', 'rc', 'alt', 'art',
  'japanese', 'english', 'prizm', 'optic', 'chrome', 'refractor', 'mosaic',
  'select', 'topps', 'panini', 'bowman', 'donruss', 'onepiece', 'pokemon',
  'charizard', 'pikachu', 'v', 'gx', 'ex', 'sp', 'sr', 'ar', 'ur', 'fa', 'sa',
]);

export function cleanedTitleTokens(title: string): string[] {
  const normalized = title
    .toLowerCase()
    .replace(/one\s+piece/gi, 'onepiece')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.split(' ').filter(w => {
    if (w.length === 0) return false;
    if (KEEP_TERMS.has(w)) return true;
    if (STOP_WORDS.has(w)) return false;
    return w.length > 1;
  });
}

// ─── Junk detection ─────────────────────────────────────
const JUNK_GROUPS: Record<string, string[]> = {
  lots: ['lot', 'lots', 'bundle', 'bulk'],
  fake: ['proxy', 'custom', 'fan art', 'replica', 'reprint', 'digital'],
  condition: ['damaged', 'poor', 'heavily played', 'hp', 'crease', 'bent', 'read description'],
  mystery: ['mystery', 'repack', 'assorted'],
};

export function detectJunkKeywords(title: string): { isLikelyJunk: boolean; reasons: string[] } {
  const lower = title.toLowerCase();
  const reasons: string[] = [];
  for (const [group, keywords] of Object.entries(JUNK_GROUPS)) {
    for (const kw of keywords) {
      if (kw.includes(' ') ? lower.includes(kw) : new RegExp(`\\b${kw}\\b`, 'i').test(lower)) {
        reasons.push(`${group}:${kw}`);
      }
    }
  }
  return { isLikelyJunk: reasons.length > 0, reasons };
}

// ─── Graded detection ───────────────────────────────────
const GRADED_KEYWORDS = ['psa', 'bgs', 'sgc', 'cgc', 'graded', 'gem mint', 'mint 9', 'mint 10', 'slab'];

export function detectLikelyGraded(title: string): boolean {
  const lower = title.toLowerCase();
  return GRADED_KEYWORDS.some(kw => lower.includes(kw));
}

// ─── Market mode inference ──────────────────────────────
const TCG_SIGNALS = ['pokemon', 'pokémon', 'charizard', 'pikachu', 'one piece', 'onepiece', 'yugioh', 'magic', 'digimon', 'dragonball', 'lorcana'];
const SPORTS_SIGNALS = ['topps', 'panini', 'prizm', 'bowman', 'donruss', 'optic', 'select', 'nba', 'nfl', 'mlb', 'rookie', 'quarterback', 'rc'];

export function deriveMarketMode(title: string, current: MarketMode): MarketMode {
  if (current !== 'all') return current;
  const lower = title.toLowerCase();
  const tcgScore = TCG_SIGNALS.filter(s => lower.includes(s)).length;
  const sportsScore = SPORTS_SIGNALS.filter(s => lower.includes(s)).length;
  if (tcgScore > sportsScore) return 'tcg';
  if (sportsScore > tcgScore) return 'sports';
  return 'all';
}

// ─── Normalized label ───────────────────────────────────
export function buildNormalizedLabel(title: string): string {
  let label = title
    .replace(/[\u{1F600}-\u{1F9FF}]/gu, '')
    .replace(/\b(free\s+shipping|ships?\s+free|fast\s+ship(ping)?|must\s+see|invest|hot|fire|rare|wow|l@@k|look)\b/gi, '')
    .replace(/\([^)]{0,40}\)/g, '')
    .replace(/[!?]+/g, '')
    .replace(/[|~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (label.length > 80) label = label.substring(0, 77) + '…';
  return label;
}

// ─── Similarity ─────────────────────────────────────────
export function estimateSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let overlap = 0;
  for (const t of setA) if (setB.has(t)) overlap++;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? overlap / union : 0;
}

// ─── Clustering ─────────────────────────────────────────
const SIMILARITY_THRESHOLD = 0.35;
const MIN_CLUSTER_SIZE = 2;

export function groupSimilarListings(results: NormalizedListing[]): NormalizedListing[] {
  const clusters: Map<string, NormalizedListing[]> = new Map();
  const assigned = new Set<string>();
  let clusterId = 0;

  for (let i = 0; i < results.length; i++) {
    if (assigned.has(results[i].id)) continue;
    const clusterMembers = [results[i]];
    const cId = `cluster-${clusterId++}`;
    assigned.add(results[i].id);

    for (let j = i + 1; j < results.length; j++) {
      if (assigned.has(results[j].id)) continue;
      const sim = estimateSimilarity(results[i].tokenSignature, results[j].tokenSignature);
      if (sim >= SIMILARITY_THRESHOLD) {
        clusterMembers.push(results[j]);
        assigned.add(results[j].id);
      }
    }

    if (clusterMembers.length >= MIN_CLUSTER_SIZE) {
      clusters.set(cId, clusterMembers);
    }
  }

  // Compute stats and assign back
  const enhanced = [...results];
  for (const [cId, members] of clusters) {
    const stats = computeClusterStats(members);
    const confidence = deriveClusterConfidence(members);
    for (const member of members) {
      const idx = enhanced.findIndex(r => r.id === member.id);
      if (idx === -1) continue;
      enhanced[idx] = {
        ...enhanced[idx],
        activeClusterId: cId,
        clusterMedian: stats.median,
        clusterMin: stats.min,
        clusterMax: stats.max,
        clusterCount: stats.count,
        clusterConfidence: confidence,
        activeDiscountPercent: enhanced[idx].totalCost !== null && stats.median > 0
          ? Math.round(((stats.median - enhanced[idx].totalCost!) / stats.median) * 100)
          : null,
      };
    }
  }
  return enhanced;
}

export function computeClusterStats(members: NormalizedListing[]): { min: number; median: number; max: number; count: number } {
  const prices = members.map(m => m.totalCost).filter((p): p is number => p !== null).sort((a, b) => a - b);
  if (prices.length === 0) return { min: 0, median: 0, max: 0, count: 0 };
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];
  return { min: prices[0], median: Math.round(median * 100) / 100, max: prices[prices.length - 1], count: prices.length };
}

export function deriveClusterConfidence(members: NormalizedListing[]): ClusterConfidence {
  if (members.length >= 5) return 'high';
  if (members.length >= 3) return 'medium';
  return 'low';
}

// ─── Opportunity score ──────────────────────────────────
export function computeOpportunityScore(
  listing: NormalizedListing,
): { score: number; strength: OpportunityStrength } {
  let score = 50;

  if (listing.isLikelyJunk) score -= 40;
  if (listing.imageUrl) score += 3;

  // Cluster-based adjustments
  if (listing.clusterCount >= 3 && listing.activeDiscountPercent !== null) {
    if (listing.activeDiscountPercent >= 20) score += 25;
    else if (listing.activeDiscountPercent >= 15) score += 18;
    else if (listing.activeDiscountPercent >= 10) score += 10;
    else if (listing.activeDiscountPercent < 0) score -= 5; // overpriced
  }

  // Auction ending soon
  if (listing.listingType === 'auction' && listing.endTime) {
    const hoursLeft = (new Date(listing.endTime).getTime() - Date.now()) / 3600000;
    if (hoursLeft > 0 && hoursLeft <= 4) score += 10;
    else if (hoursLeft > 0 && hoursLeft <= 12) score += 5;
  }

  // BIN below median
  if (listing.listingType === 'bin' && listing.activeDiscountPercent !== null && listing.activeDiscountPercent > 5) {
    score += 8;
  }

  // Token specificity
  if (listing.tokenSignature.length >= 5) score += 5;
  else if (listing.tokenSignature.length <= 2) score -= 10;

  // Cluster confidence penalty
  if (listing.clusterConfidence === 'low') score -= 12;

  score = Math.max(0, Math.min(100, score));

  let strength: OpportunityStrength;
  if (score >= 80) strength = 'strong';
  else if (score >= 65) strength = 'good';
  else if (score >= 45) strength = 'watch';
  else strength = 'weak';

  return { score, strength };
}

// ─── Time left ──────────────────────────────────────────
export function formatTimeLeft(endTime: string | null | undefined): string | null {
  if (!endTime) return null;
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
