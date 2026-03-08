import { useState, useMemo } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoiCalculatorProps {
  psa10MedianPrice: number | null;
}

export function RoiCalculator({ psa10MedianPrice }: RoiCalculatorProps) {
  const [rawPrice, setRawPrice] = useState<string>('');
  const [gradingCost, setGradingCost] = useState<string>('25');
  const [gemRate, setGemRate] = useState<string>('50');
  const [isExpanded, setIsExpanded] = useState(false);

  const calculations = useMemo(() => {
    const raw = parseFloat(rawPrice);
    const grading = parseFloat(gradingCost);
    const rate = parseFloat(gemRate) / 100;
    const psa10Value = psa10MedianPrice;

    if (!raw || !grading || !rate || !psa10Value || raw <= 0 || psa10Value <= 0) return null;

    const expectedPsa10Value = psa10Value * rate;
    const totalCost = raw + grading;
    const expectedProfit = expectedPsa10Value - totalCost;
    const roiPercent = (expectedProfit / totalCost) * 100;

    // Break-even gem rate: at what gem rate do you break even?
    // breakEvenRate * psa10Value = raw + grading
    const breakEvenGemRate = ((raw + grading) / psa10Value) * 100;

    return {
      expectedPsa10Value: Math.round(expectedPsa10Value * 100) / 100,
      expectedProfit: Math.round(expectedProfit * 100) / 100,
      roiPercent: Math.round(roiPercent * 10) / 10,
      breakEvenGemRate: Math.round(breakEvenGemRate * 10) / 10,
    };
  }, [rawPrice, gradingCost, gemRate, psa10MedianPrice]);

  if (psa10MedianPrice === null) return null;

  return (
    <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--om-border-0)' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-1.5 px-2.5 py-2 text-left transition-colors"
        style={{ background: 'var(--om-bg-2)' }}
      >
        <Calculator className="h-3 w-3" style={{ color: 'var(--om-accent)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--om-text-2)' }}>
          ROI Calculator
        </span>
        <span className="ml-auto text-[10px]" style={{ color: 'var(--om-text-3)' }}>
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="p-2.5 space-y-2" style={{ background: 'var(--om-bg-2)' }}>
          {/* Inputs */}
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="block text-[9px] mb-0.5" style={{ color: 'var(--om-text-3)' }}>Raw Price</label>
              <div className="relative">
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--om-text-3)' }}>$</span>
                <input
                  type="number"
                  value={rawPrice}
                  onChange={e => setRawPrice(e.target.value)}
                  placeholder="0"
                  className="w-full h-6 pl-4 pr-1 text-[11px] rounded font-mono tabular-nums"
                  style={{ background: 'var(--om-bg-3)', color: 'var(--om-text-0)', border: '1px solid var(--om-border-0)' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] mb-0.5" style={{ color: 'var(--om-text-3)' }}>Grade Cost</label>
              <div className="relative">
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--om-text-3)' }}>$</span>
                <input
                  type="number"
                  value={gradingCost}
                  onChange={e => setGradingCost(e.target.value)}
                  className="w-full h-6 pl-4 pr-1 text-[11px] rounded font-mono tabular-nums"
                  style={{ background: 'var(--om-bg-3)', color: 'var(--om-text-0)', border: '1px solid var(--om-border-0)' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] mb-0.5" style={{ color: 'var(--om-text-3)' }}>Gem Rate</label>
              <div className="relative">
                <input
                  type="number"
                  value={gemRate}
                  onChange={e => setGemRate(e.target.value)}
                  className="w-full h-6 pl-1.5 pr-4 text-[11px] rounded font-mono tabular-nums"
                  style={{ background: 'var(--om-bg-3)', color: 'var(--om-text-0)', border: '1px solid var(--om-border-0)' }}
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--om-text-3)' }}>%</span>
              </div>
            </div>
          </div>

          {/* Results */}
          {calculations && (
            <div className="space-y-1 pt-1.5" style={{ borderTop: '1px solid var(--om-divider)' }}>
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: 'var(--om-text-2)' }}>Expected PSA10 Value</span>
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: 'var(--om-text-0)' }}>
                  ${calculations.expectedPsa10Value.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: 'var(--om-text-2)' }}>Expected Profit</span>
                <span className={cn("text-[10px] font-semibold tabular-nums", calculations.expectedProfit >= 0 ? "text-green-500" : "text-red-500")}>
                  {calculations.expectedProfit >= 0 ? '+' : ''}${calculations.expectedProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: 'var(--om-text-2)' }}>ROI</span>
                <span className={cn("text-[10px] font-semibold tabular-nums", calculations.roiPercent >= 0 ? "text-green-500" : "text-red-500")}>
                  {calculations.roiPercent >= 0 ? '+' : ''}{calculations.roiPercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: 'var(--om-text-2)' }}>Break-even Gem Rate</span>
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: 'var(--om-text-0)' }}>
                  {calculations.breakEvenGemRate.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {!calculations && rawPrice && (
            <p className="text-[9px]" style={{ color: 'var(--om-text-3)' }}>
              Enter values above to calculate ROI
            </p>
          )}
        </div>
      )}
    </div>
  );
}
