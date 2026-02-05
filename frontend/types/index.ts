export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Contract {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  parties: Array<{ name: string; role: string }>;
  type_contrat: string;
  clauses_risque: Array<{
    clause: string;
    niveau: string;
    explication: string;
  }>;
  score_equilibre: number;
  score_clarity: number;
  recommandations: string[];
}

export interface Analysis {
  id: string;
  contract_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: AnalysisResult;
  score_equity?: number;
  score_clarity?: number;
  created_at: string;
}

export interface AnalysisStatusResponse {
  contract_id: string;
  analysis_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  score_equity?: number;
  score_clarity?: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface ApiError {
  detail: string;
}
