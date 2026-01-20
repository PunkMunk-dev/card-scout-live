export interface CertifiedGrade {
  company: string;  // "PSA", "BGS", "SGC", etc.
  grade: number;    // 10, 9.5, 9, etc.
}

export interface ComparisonResult {
  centeringMatch: number;    // 1-10 scale
  cornersMatch: number;      // 1-10 scale
  edgesMatch: number;        // 1-10 scale
  surfaceMatch: number;      // 1-10 scale
  defectsFound: string[];    // Specific defects identified
  psa10Probability: number;  // Percentage likelihood
  reasoning: string;         // AI explanation
}

export interface GemScoreResult {
  listingId: string;
  gemScore: number | null;
  psa10Likelihood: 'High' | 'Medium' | 'Low' | 'Certified';
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
  // Certified grade extraction
  certifiedGrade?: CertifiedGrade;
  // Reference-based comparison (new)
  analysisMethod?: 'ximilar_only' | 'reference_comparison' | 'certified_extraction' | 'hybrid';
  comparisonResult?: ComparisonResult;
  referenceImagesUsed?: number;
}

export interface GemScoreState {
  loading: boolean;
  result: GemScoreResult | null;
}
