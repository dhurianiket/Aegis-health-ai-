export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface AIExtractionResponse {
  date: string;
  hospitalName: string;
  type: string;
  extractedData: {
    findings?: string;
    lab_values?: Array<{
      markerName: string;
      value: number;
      unit: string;
      referenceRange?: string;
      status: string;
    }>;
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      indications?: string[];
    }>;
  };
}

export interface SpecialistAnalysisResponse {
  summary: string;
  confidence_score: number;
  abnormalities: string[];
  next_steps: string[];
  disclaimer: string;
}
