import api from './api';

export interface Therapist {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization?: string | null;
  licenseNumber?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TherapistsResponse {
  therapists: Therapist[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const therapistService = {
  getAll: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<TherapistsResponse> => {
    const response = await api.get<{ success: boolean; data: TherapistsResponse }>(
      '/therapists',
      { params }
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<Therapist> => {
    const response = await api.get<{ success: boolean; data: Therapist }>(
      `/therapists/${id}`
    );
    return response.data.data;
  },
};
