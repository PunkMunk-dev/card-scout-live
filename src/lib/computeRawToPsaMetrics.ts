import type { Psa10SoldRecord } from './parse130pointSales';

export interface SoldStats {
  avgSold: number;
  medianSold: number;
  salesCount: number;
}

export interface RawToPsaMetrics {
  totalBuyCost: number;
  estimatedSellingFee: number;
  netProfit: number;
  roiPercent: number;
  maxBuyPrice: number;
}

export type Confidence = 'high' | 'medium' | 'low' | 'none';

export function computeSoldStats(comps: Psa10SoldRecord[]): SoldStats {
  if (comps.length === 0) return { avgSold: 0, medianSold: 0, salesCount: 0 };

  const prices = comps.map(c => c.soldPrice).sort((a, b) => a - b);
  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = sum / prices.length;
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0
    ? (prices[mid - 1] + prices[mid]) / 2
    : prices[mid];

  return { avgSold: Math.round(avg * 100) / 100, medianSold: Math.round(median * 100) / 100, salesCount: prices.length };
}

export function computeMetrics(
  rawPrice: number,
  shipping: number,
  psa10MedianSold: number,
  gradingCost: number,
  sellFeePercent: number,
  desiredProfit: number,
): RawToPsaMetrics {
  const totalBuyCost = rawPrice + shipping;
  const estimatedSellingFee = psa10MedianSold * (sellFeePercent / 100);
  const netProfit = psa10MedianSold - totalBuyCost - gradingCost - estimatedSellingFee;
  const roiPercent = totalBuyCost > 0 ? (netProfit / totalBuyCost) * 100 : 0;
  const maxBuyPrice = psa10MedianSold - desiredProfit - gradingCost - estimatedSellingFee;

  return {
    totalBuyCost: Math.round(totalBuyCost * 100) / 100,
    estimatedSellingFee: Math.round(estimatedSellingFee * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    roiPercent: Math.round(roiPercent * 10) / 10,
    maxBuyPrice: Math.round(maxBuyPrice * 100) / 100,
  };
}

export function deriveConfidence(salesCount: number): Confidence {
  if (salesCount >= 5) return 'high';
  if (salesCount >= 3) return 'medium';
  if (salesCount >= 1) return 'low';
  return 'none';
}
