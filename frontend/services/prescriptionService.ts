import api from './api';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  therapistId?: string | null;
  prescriptionDate: string;
  diagnosis?: string | null;
  medications: Medication[];
  instructions?: string | null;
  notes?: string | null;
  printed: boolean;
  printedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
    dui?: string | null;
    birthDate?: string | null;
    address?: string | null;
  };
  therapist?: {
    id: string;
    name: string;
    specialization?: string | null;
  } | null;
}

export interface CreatePrescriptionData {
  patientId: string;
  therapistId?: string | null;
  prescriptionDate?: string;
  diagnosis?: string | null;
  medications: Medication[];
  instructions?: string | null;
  notes?: string | null;
}

export interface UpdatePrescriptionData {
  patientId?: string;
  therapistId?: string | null;
  prescriptionDate?: string;
  diagnosis?: string | null;
  medications?: Medication[];
  instructions?: string | null;
  notes?: string | null;
}

export interface PrescriptionsResponse {
  prescriptions: Prescription[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const prescriptionService = {
  getAll: async (params?: {
    patientId?: string;
    therapistId?: string;
    page?: number;
    limit?: number;
  }): Promise<PrescriptionsResponse> => {
    const response = await api.get<{ success: boolean; data: PrescriptionsResponse }>(
      '/prescriptions',
      { params }
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<Prescription> => {
    const response = await api.get<{ success: boolean; data: Prescription }>(
      `/prescriptions/${id}`
    );
    return response.data.data;
  },

  create: async (data: CreatePrescriptionData): Promise<Prescription> => {
    const response = await api.post<{ success: boolean; data: Prescription }>(
      '/prescriptions',
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: UpdatePrescriptionData): Promise<Prescription> => {
    const response = await api.put<{ success: boolean; data: Prescription }>(
      `/prescriptions/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/prescriptions/${id}`);
  },

  markAsPrinted: async (id: string): Promise<Prescription> => {
    const response = await api.post<{ success: boolean; data: Prescription }>(
      `/prescriptions/${id}/print`
    );
    return response.data.data;
  },
};

