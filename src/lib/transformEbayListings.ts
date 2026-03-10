import type { EbayItem } from '@/types/ebay';
import type { NormalizedListing, MarketMode, ScannerFilters } from '@/types/scanner';
import {
  deriveTotalCost,
  cleanedTitleTokens,
  detectJunkKeywords,
  detectLikelyGraded,
  deriveMarketMode,
  buildNormalizedLabel,
  groupSimilarListings,
  computeOpportunityScore,
  formatTimeLeft,
} from './scannerUtils';

export function transformEbayItems(
  items: EbayItem[],
  activeFilters: ScannerFilters,
): NormalizedListing[] {
  // Step 1: normalize each item
  let results: NormalizedListing[] = items.map(item => {
    const price = parseFloat(item.price?.value || '0') || null;
    const shipping = item.shipping ? (parseFloat(item.shipping.value || '0') || 0) : 0;
    const totalCost = deriveTotalCost(price, shipping);
    const tokens = cleanedTitleTokens(item.title);
    const junk = detectJunkKeywords(item.title);
    const isGraded = detectLikelyGraded(item.title);
    const market = deriveMarketMode(item.title, activeFilters.marketMode);
    const listingType = item.buyingOption === 'AUCTION' ? 'auction' as const : 'bin' as const;

    return {
      id: item.itemId,
      title: item.title,
      cleanedTitle: buildNormalizedLabel(item.title),
      normalizedLabel: buildNormalizedLabel(item.title),
      imageUrl: item.imageUrl ?? null,
      ebayUrl: item.itemUrl ?? null,
      market,
      listingType,
      price,
      shipping,
      totalCost,
      condition: item.condition ?? null,
      sellerName: item.seller ?? null,
      timeLeftLabel: formatTimeLeft(item.endDate),
      endTime: item.endDate ?? null,
      tokenSignature: tokens,
      isLikelyJunk: junk.isLikelyJunk,
      junkReasons: junk.reasons,
      activeClusterId: null,
      clusterMedian: null,
      clusterMin: null,
      clusterMax: null,
      clusterCount: 0,
      activeDiscountPercent: null,
      opportunityScore: 50,
      opportunityStrength: 'watch' as const,
      clusterConfidence: 'low' as const,
      _isGraded: isGraded,
    } as NormalizedListing & { _isGraded: boolean };
  });

  // Step 2: apply exclusion filters
  results = results.filter(r => {
    const ext = r as NormalizedListing & { _isGraded?: boolean };
    if (activeFilters.excludeLots && r.junkReasons.some(j => j.startsWith('lots:'))) return false;
    if (activeFilters.excludeReprints && r.junkReasons.some(j => j.includes('reprint'))) return false;
    if (activeFilters.excludeProxyCustom && r.junkReasons.some(j => j.startsWith('fake:'))) return false;
    if (activeFilters.excludeDamaged && r.junkReasons.some(j => j.startsWith('condition:'))) return false;
    if (activeFilters.excludeGraded && ext._isGraded) return false;
    if (activeFilters.rawOnly && ext._isGraded) return false;
    if (activeFilters.listingType === 'auction' && r.listingType !== 'auction') return false;
    if (activeFilters.listingType === 'bin' && r.listingType !== 'bin') return false;
    if (activeFilters.minPrice !== null && (r.totalCost ?? 0) < activeFilters.minPrice) return false;
    if (activeFilters.maxPrice !== null && r.totalCost !== null && r.totalCost > activeFilters.maxPrice) return false;
    if (activeFilters.endingSoonOnly) {
      if (!r.endTime) return false;
      const hoursLeft = (new Date(r.endTime).getTime() - Date.now()) / 3600000;
      if (hoursLeft > 12 || hoursLeft <= 0) return false;
    }
    if (activeFilters.excludedKeywords.length > 0) {
      const lower = r.title.toLowerCase();
      if (activeFilters.excludedKeywords.some(kw => lower.includes(kw.toLowerCase()))) return false;
    }
    return true;
  });

  // Clean the _isGraded temp field
  results = results.map(({ ...r }) => {
    const { _isGraded, ...clean } = r as any;
    return clean as NormalizedListing;
  });

  // Step 3: cluster similar listings
  results = groupSimilarListings(results);

  // Step 4: compute opportunity scores
  results = results.map(r => {
    const { score, strength } = computeOpportunityScore(r);
    return { ...r, opportunityScore: score, opportunityStrength: strength };
  });

  return results;
}

export function sortResults(results: NormalizedListing[], sortBy: string): NormalizedListing[] {
  const sorted = [...results];
  switch (sortBy) {
    case 'bestOpportunity':
      return sorted.sort((a, b) => b.opportunityScore - a.opportunityScore || (b.activeDiscountPercent ?? 0) - (a.activeDiscountPercent ?? 0));
    case 'biggestActiveDiscount':
      return sorted.sort((a, b) => (b.activeDiscountPercent ?? -999) - (a.activeDiscountPercent ?? -999));
    case 'endingSoon':
      return sorted.sort((a, b) => {
        const aEnd = a.endTime ? new Date(a.endTime).getTime() : Infinity;
        const bEnd = b.endTime ? new Date(b.endTime).getTime() : Infinity;
        return aEnd - bEnd;
      });
    case 'priceAsc':
      return sorted.sort((a, b) => (a.totalCost ?? Infinity) - (b.totalCost ?? Infinity));
    case 'priceDesc':
      return sorted.sort((a, b) => (b.totalCost ?? 0) - (a.totalCost ?? 0));
    case 'relevance':
    default:
      return sorted;
  }
}
