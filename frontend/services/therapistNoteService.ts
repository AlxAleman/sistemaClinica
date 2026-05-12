import api from './api';

export interface TherapistNote {
  id: string;
  patientId: string;
  therapistId: string;
  medicalProfileId: string;
  sessionId?: string | null;
  content: string;
  createdAt: string;
  therapist?: {
    name: string;
    specialization?: string | null;
  };
}

export interface CreateTherapistNoteData {
  patientId: string;
  therapistId: string;
  sessionId?: string | null;
  content: string;
}

export const therapistNoteService = {
  getByPatient: async (patientId: string): Promise<TherapistNote[]> => {
    const response = await api.get<{ success: boolean; data: TherapistNote[] }>(
      `/therapist-notes/patient/${patientId}`
    );
    return response.data.data;
  },

  create: async (data: CreateTherapistNoteData): Promise<TherapistNote> => {
    const response = await api.post<{ success: boolean; data: TherapistNote }>(
      '/therapist-notes',
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/therapist-notes/${id}`);
  },
};
