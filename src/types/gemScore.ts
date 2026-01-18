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
}

export interface GemScoreState {
  loading: boolean;
  result: GemScoreResult | null;
}
