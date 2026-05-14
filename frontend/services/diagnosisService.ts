import api from './api';

export interface Diagnosis {
  id: string;
  patientId: string;
  clinicalDiagnosis: string;
  diagnosisDate: string;
  observations?: string | null;
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
  evaluacionFisicaId?: string | null;
  evaluacionFisica?: { id: string; tipo: string | null; fechaEvaluacion: string } | null;
  createdAt: string;
  updatedAt: string;
  treatmentPlans?: {
    id: string;
    title: string;
    status: string;
    sessionsPlanned: number;
    sessionsCompleted: number;
  }[];
}

export interface CreateDiagnosisData {
  patientId: string;
  clinicalDiagnosis: string;
  diagnosisDate: string;
  observations?: string | null;
  status?: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
  evaluacionFisicaId?: string | null;
}

export const diagnosisService = {
  getByPatient: async (patientId: string): Promise<Diagnosis[]> => {
    const response = await api.get<{ success: boolean; data: Diagnosis[] }>(
      `/diagnoses/patient/${patientId}`
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<Diagnosis> => {
    const response = await api.get<{ success: boolean; data: Diagnosis }>(
      `/diagnoses/${id}`
    );
    return response.data.data;
  },

  create: async (data: CreateDiagnosisData): Promise<Diagnosis> => {
    const response = await api.post<{ success: boolean; data: Diagnosis }>(
      '/diagnoses',
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateDiagnosisData>): Promise<Diagnosis> => {
    const response = await api.put<{ success: boolean; data: Diagnosis }>(
      `/diagnoses/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/diagnoses/${id}`);
  },
};
