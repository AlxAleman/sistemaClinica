import api from './api';

export type TreatmentPlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface ProtocolItem {
  order: number;
  type: string;
  procedure: string;
  area?: string;
  side?: string;
  duration?: number;
  intensity?: string;
  series?: number;
  reps?: number;
  weight?: string;
  resistance?: string;
  notes?: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  diagnosisId?: string | null;
  title: string;
  therapyType?: string | null;
  description?: string | null;
  goals?: string | null;
  frequency?: string | null;
  sessionDuration?: number | null;
  sessionsPlanned: number;
  sessionsCompleted: number;
  sessionsRemaining?: number;
  protocol?: ProtocolItem[] | null;
  totalCost?: number | null;
  status: TreatmentPlanStatus;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
  };
  diagnosis?: {
    id: string;
    clinicalDiagnosis: string;
    status: string;
  } | null;
}

export interface CreateTreatmentPlanData {
  patientId: string;
  diagnosisId?: string | null;
  title: string;
  therapyType?: string | null;
  description?: string | null;
  goals?: string | null;
  frequency?: string | null;
  sessionDuration?: number | null;
  sessionsPlanned: number;
  protocol?: ProtocolItem[] | null;
  totalCost?: number | null;
  status?: TreatmentPlanStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateTreatmentPlanData {
  patientId?: string;
  diagnosisId?: string | null;
  title?: string;
  therapyType?: string | null;
  description?: string | null;
  goals?: string | null;
  frequency?: string | null;
  sessionDuration?: number | null;
  sessionsPlanned?: number;
  protocol?: ProtocolItem[] | null;
  totalCost?: number | null;
  status?: TreatmentPlanStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface TreatmentPlansResponse {
  treatmentPlans: TreatmentPlan[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const treatmentPlanService = {
  getAll: async (params?: {
    patientId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<TreatmentPlansResponse> => {
    const response = await api.get<{ success: boolean; data: TreatmentPlansResponse }>(
      '/treatment-plans',
      { params }
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<TreatmentPlan> => {
    const response = await api.get<{ success: boolean; data: TreatmentPlan }>(
      `/treatment-plans/${id}`
    );
    return response.data.data;
  },

  create: async (data: CreateTreatmentPlanData): Promise<TreatmentPlan> => {
    const response = await api.post<{ success: boolean; data: TreatmentPlan }>(
      '/treatment-plans',
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: UpdateTreatmentPlanData): Promise<TreatmentPlan> => {
    const response = await api.put<{ success: boolean; data: TreatmentPlan }>(
      `/treatment-plans/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/treatment-plans/${id}`);
  },

  approve: async (id: string): Promise<TreatmentPlan> => {
    const response = await api.post<{ success: boolean; data: TreatmentPlan }>(
      `/treatment-plans/${id}/approve`
    );
    return response.data.data;
  },
};

