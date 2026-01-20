export interface GemScoreResult {
  listingId: string;
  gemScore: number | null;
  psa10Likelihood: 'High' | 'Medium' | 'Low';
  confidence: number;
  subgrades: {
    centering?: number;
    corners?: number;
    edges?: number;
    surface?: number;
  } | null;
  error?: string;
  // Breakdown metadata
  rawGrade?: number;        // Original Ximilar grade (1-10 scale)
  cached?: boolean;         // Whether result was served from cache
  gradeSource?: string;     // Which field the grade was extracted from
}

export interface GemScoreState {
  loading: boolean;
  result: GemScoreResult | null;
}
