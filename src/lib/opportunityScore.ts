/**
 * Opportunity scoring engine for sports card listings.
 * Compares active listing price against sold comp data to output a buy signal.
 */

import type { CardMarketMetrics } from '@/hooks/useCardMarketMetrics';
import { getConfidenceLevel } from '@/hooks/useCardMarketMetrics';

export type OpportunityLabel = 'Strong Buy' | 'Potential Flip' | 'Neutral' | 'Overpriced';

export interface OpportunityScore {
  label: OpportunityLabel;
  color: string;
  upsideDollars: number | null;
  expectedProfit: number | null;
  modeledRoi: number | null;
  gated: boolean;
  reason: string;
}

const DEFAULT_GRADING_COST = 25;
const DEFAULT_GEM_RATE = 0.5;

export function computeOpportunityScore(
  listingPrice: number | null,
  metrics: CardMarketMetrics | null,
  options?: { gradingCost?: number; gemRate?: number }
): OpportunityScore {
  const gradingCost = options?.gradingCost ?? DEFAULT_GRADING_COST;
  const gemRate = options?.gemRate ?? DEFAULT_GEM_RATE;

  // Gate: need full confidence
  const confidence = getConfidenceLevel(metrics);
  if (confidence !== 'full' || !metrics) {
    return { label: 'Neutral', color: 'var(--om-text-3)', upsideDollars: null, expectedProfit: null, modeledRoi: null, gated: true, reason: 'Insufficient exact-match data' };
  }

  if (listingPrice === null || listingPrice <= 0) {
    return { label: 'Neutral', color: 'var(--om-text-3)', upsideDollars: null, expectedProfit: null, modeledRoi: null, gated: true, reason: 'No listing price available' };
  }

  const psa10Median = metrics.psa10_median_price!;
  const upsideDollars = psa10Median - listingPrice - gradingCost;
  const expectedProfit = upsideDollars * gemRate;
  const totalCost = listingPrice + gradingCost;
  const modeledRoi = totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0;

  let label: OpportunityLabel;
  let color: string;

  if (modeledRoi >= 100) {
    label = 'Strong Buy';
    color = 'hsl(142 71% 45%)';
  } else if (modeledRoi >= 25) {
    label = 'Potential Flip';
    color = 'hsl(217 91% 60%)';
  } else if (modeledRoi >= -10) {
    label = 'Neutral';
    color = 'var(--om-text-3)';
  } else {
    label = 'Overpriced';
    color = 'hsl(0 84% 60%)';
  }

  const reason = `ROI ${modeledRoi >= 0 ? '+' : ''}${modeledRoi.toFixed(0)}% at ${(gemRate * 100).toFixed(0)}% gem rate`;

  return {
    label,
    color,
    upsideDollars: Math.round(upsideDollars * 100) / 100,
    expectedProfit: Math.round(expectedProfit * 100) / 100,
    modeledRoi: Math.round(modeledRoi * 10) / 10,
    gated: false,
    reason,
  };
}
