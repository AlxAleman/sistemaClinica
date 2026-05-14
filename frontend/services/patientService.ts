import api from './api';

export type DocumentCategory = 'receta' | 'radiografia' | 'laboratorio' | 'referencia' | 'informe' | 'otro';

export interface MedicalDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  description?: string | null;
  category: DocumentCategory;
  uploadedAt: string;
}

export interface Patient {
  id: string;
  email?: string | null;
  name: string;
  phone: string;
  dui?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  address?: string | null;
  residence?: string | null;
  profession?: string | null;
  workplace?: string | null;
  insuranceCompany?: string | null;
  affiliateNumber?: string | null;
  isActive?: boolean;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  createdAt: string;
  updatedAt: string;
  medicalProfile?: {
    allergies?: string | null;
    medicalHistory?: string | null;
    currentMedications?: string | null;
    notes?: string | null;
    previousCondition?: string | null;
    currentCondition?: string | null;
    generalObservations?: string | null;
  } | null;
  documents?: MedicalDocument[];
  _count?: {
    appointments: number;
    sessions: number;
    evaluations: number;
  };
}

export interface CreatePatientData {
  email?: string | null;
  name: string;
  phone: string;
  dui?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  address?: string | null;
  residence?: string | null;
  profession?: string | null;
  workplace?: string | null;
  insuranceCompany?: string | null;
  affiliateNumber?: string | null;
  isActive?: boolean;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
}

export interface UpdatePatientData extends Partial<CreatePatientData> {}

export interface PatientsResponse {
  patients: Patient[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const patientService = {
  getAll: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<PatientsResponse> => {
    const response = await api.get<{ success: boolean; data: PatientsResponse }>(
      '/patients',
      { params }
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<Patient> => {
    const response = await api.get<{ success: boolean; data: Patient }>(
      `/patients/${id}`
    );
    return response.data.data;
  },

  create: async (data: CreatePatientData): Promise<Patient> => {
    const response = await api.post<{ success: boolean; data: Patient }>(
      '/patients',
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: UpdatePatientData): Promise<Patient> => {
    const response = await api.put<{ success: boolean; data: Patient }>(
      `/patients/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}`);
  },

  updateMedicalProfile: async (
    id: string,
    data: {
      allergies?: string | null;
      medicalHistory?: string | null;
      currentMedications?: string | null;
      notes?: string | null;
      previousCondition?: string | null;
      currentCondition?: string | null;
      generalObservations?: string | null;
    }
  ) => {
    const response = await api.post<{ success: boolean; data: any }>(
      `/patients/${id}/medical-profile`,
      data
    );
    return response.data.data;
  },

  uploadDocument: async (
    id: string,
    data: {
      fileName: string;
      fileUrl: string;
      fileType: string;
      description?: string | null;
      category?: string;
    }
  ): Promise<MedicalDocument> => {
    const response = await api.post<{ success: boolean; data: MedicalDocument }>(
      `/patients/${id}/documents`,
      data
    );
    return response.data.data;
  },

  deleteDocument: async (patientId: string, documentId: string): Promise<void> => {
    await api.delete(`/patients/${patientId}/documents/${documentId}`);
  },
};
