import api from './api';

export interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  goals?: string | null;
  sessionsPlanned: number;
  sessionsCompleted: number;
  totalCost?: number | null;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  approvedByPatient: boolean;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
  };
}

export interface CreateTreatmentPlanData {
  patientId: string;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  goals?: string | null;
  sessionsPlanned: number;
  totalCost?: number | null;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface UpdateTreatmentPlanData {
  patientId?: string;
  title?: string;
  description?: string | null;
  diagnosis?: string | null;
  goals?: string | null;
  sessionsPlanned?: number;
  totalCost?: number | null;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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

