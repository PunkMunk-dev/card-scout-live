export interface CertifiedGrade {
  company: string;  // "PSA", "BGS", "SGC", etc.
  grade: number;    // 10, 9.5, 9, etc.
}

export interface CardMetadata {
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

export interface GemRateResult {
  listingId: string;
  gemRate: number | null;
  psa10Likelihood: 'High' | 'Medium' | 'Low' | 'Certified';
  psa9Rate?: number;
  confidence: number;
  
  // Historical data
  dataPoints: number;
  qcRating: 'excellent' | 'good' | 'average' | 'poor' | string;
  qcNotes: string;
  source: string;
  matchType: 'exact' | 'product' | 'brand' | 'era' | 'default';
  
  // Modifiers
  baseRate?: number;
  modifiersApplied: string[];
  
  // Card metadata
  cardMetadata?: CardMetadata;
  
  // Certified grade (if already graded)
  certifiedGrade?: CertifiedGrade;
  
  // Analysis info
  analysisMethod: 'historical_data' | 'certified_extraction' | 'failed';
  
  // Error state
  error?: string;
  
  // Real data from listing (when popData is extracted)
  isRealData?: boolean;
  psa10Count?: number;
}

export interface GemRateState {
  loading: boolean;
  result: GemRateResult | null;
}

// Legacy alias for backward compatibility during transition
export type GemScoreResult = GemRateResult;
export type GemScoreState = GemRateState;
