
export interface EvaluationResult {
  scorecard: {
    conversationalTone: boolean;
    scannability: boolean;
    creativeFormatting: boolean;
    wordCount: number;
    packaging: boolean;
    adminCheck: boolean;
  };
  readinessRating: "Ready for Review" | "Needs Minor Polish" | "Needs Structural Rework";
  editorNotes: string[];
  polishedDraft: string;
}

export interface AppState {
  draft: string;
  evaluation: EvaluationResult | null;
  isLoading: boolean;
  error: string | null;
}
