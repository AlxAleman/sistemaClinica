import api from './api';

export interface Evaluation {
  id: string;
  patientId: string;
  evaluationType: 'INITIAL' | 'PROGRESS' | 'FINAL';
  evaluationDate: string;
  rangeOfMotion?: string | null;
  strength?: string | null;
  painLevel?: number | null;
  functionalAssessment?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
  };
}

export interface CreateEvaluationData {
  patientId: string;
  evaluationType: 'INITIAL' | 'PROGRESS' | 'FINAL';
  evaluationDate: string; // ISO datetime string
  rangeOfMotion?: string | null;
  strength?: string | null;
  painLevel?: number | null;
  functionalAssessment?: string | null;
  notes?: string | null;
}

export interface UpdateEvaluationData {
  patientId?: string;
  evaluationType?: 'INITIAL' | 'PROGRESS' | 'FINAL';
  evaluationDate?: string;
  rangeOfMotion?: string | null;
  strength?: string | null;
  painLevel?: number | null;
  functionalAssessment?: string | null;
  notes?: string | null;
}

export interface EvaluationComparison {
  initial?: Evaluation;
  final?: Evaluation;
  progress?: Evaluation[];
  improvements?: {
    painLevel?: number;
    rangeOfMotion?: string;
    strength?: string;
    functionalAssessment?: string;
  };
}

export interface EvaluationsResponse {
  evaluations: Evaluation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const evaluationService = {
  getAll: async (params?: {
    patientId?: string;
    evaluationType?: string;
    page?: number;
    limit?: number;
  }): Promise<EvaluationsResponse> => {
    const response = await api.get<{ success: boolean; data: EvaluationsResponse }>(
      '/evaluations',
      { params }
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<Evaluation> => {
    const response = await api.get<{ success: boolean; data: Evaluation }>(
      `/evaluations/${id}`
    );
    return response.data.data;
  },

  create: async (data: CreateEvaluationData): Promise<Evaluation> => {
    const response = await api.post<{ success: boolean; data: Evaluation }>(
      '/evaluations',
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: UpdateEvaluationData): Promise<Evaluation> => {
    const response = await api.put<{ success: boolean; data: Evaluation }>(
      `/evaluations/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/evaluations/${id}`);
  },

  getComparison: async (patientId: string): Promise<EvaluationComparison> => {
    const response = await api.get<{ success: boolean; data: EvaluationComparison }>(
      `/evaluations/patients/${patientId}/comparison`
    );
    return response.data.data;
  },
};

