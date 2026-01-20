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
  rawGrade?: number;           // Original Ximilar grade (1-10 scale)
  cached?: boolean;            // Whether result was served from cache
  gradeSource?: string;        // Which field the grade was extracted from
  // Quality indicators (Phase 4)
  qualityWarnings?: string[];  // e.g., ["low_resolution", "card_in_holder", "single_image"]
  imagesAnalyzed?: number;     // Number of images analyzed (1 = front only, 2 = front+back)
}

export interface GemScoreState {
  loading: boolean;
  result: GemScoreResult | null;
}
