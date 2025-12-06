import api from './api';

export interface Therapist {
  id: string;
  email: string;
  name: string;
  phone: string;
  specialization?: string | null;
  createdAt: string;
  updatedAt: string;
  availability?: TherapistAvailability[];
  _count?: {
    appointments: number;
    sessions: number;
  };
}

export interface TherapistAvailability {
  id: string;
  therapistId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface CreateTherapistData {
  email: string;
  name: string;
  phone: string;
  specialization?: string | null;
}

export interface UpdateTherapistData extends Partial<CreateTherapistData> {}

export interface CreateAvailabilityData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
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

  create: async (data: CreateTherapistData): Promise<Therapist> => {
    const response = await api.post<{ success: boolean; data: Therapist }>(
      '/therapists',
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: UpdateTherapistData): Promise<Therapist> => {
    const response = await api.put<{ success: boolean; data: Therapist }>(
      `/therapists/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/therapists/${id}`);
  },

  getAvailability: async (therapistId: string): Promise<TherapistAvailability[]> => {
    const response = await api.get<{ success: boolean; data: TherapistAvailability[] }>(
      `/therapists/${therapistId}/availability`
    );
    return response.data.data;
  },

  createAvailability: async (
    therapistId: string,
    data: CreateAvailabilityData
  ): Promise<TherapistAvailability> => {
    const response = await api.post<{ success: boolean; data: TherapistAvailability }>(
      `/therapists/${therapistId}/availability`,
      data
    );
    return response.data.data;
  },
};

