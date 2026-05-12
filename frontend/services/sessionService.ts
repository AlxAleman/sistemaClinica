import api from './api';

export interface SessionProtocolItem {
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
  completed: boolean;
  notes: string;
}

export interface TreatmentSession {
  id: string;
  patientId: string;
  therapistId: string;
  appointmentId?: string | null;
  treatmentPlanId?: string | null;
  sessionNumber?: number | null;
  attendanceStatus?: 'PENDING' | 'ATTENDED' | 'NOT_ATTENDED' | 'RESCHEDULED' | null;
  attendanceConfirmedAt?: string | null;
  sessionDate: string;
  duration: number;
  interventions?: string | null;
  progress?: string | null;
  painLevel?: number | null;
  notes?: string | null;
  sessionProtocol?: SessionProtocolItem[] | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
  };
  therapist?: {
    id: string;
    name: string;
    specialization?: string | null;
  };
}

export interface CreateSessionData {
  patientId: string;
  therapistId: string;
  appointmentId?: string | null;
  treatmentPlanId?: string | null;
  sessionNumber?: number | null;
  attendanceStatus?: 'PENDING' | 'ATTENDED' | 'NOT_ATTENDED' | 'RESCHEDULED' | null;
  sessionDate: string;
  duration?: number;
  interventions?: string | null;
  progress?: string | null;
  painLevel?: number | null;
  notes?: string | null;
  sessionProtocol?: SessionProtocolItem[] | null;
}

export interface UpdateSessionData {
  patientId?: string;
  therapistId?: string;
  appointmentId?: string | null;
  treatmentPlanId?: string | null;
  sessionNumber?: number | null;
  attendanceStatus?: 'PENDING' | 'ATTENDED' | 'NOT_ATTENDED' | 'RESCHEDULED' | null;
  sessionDate?: string;
  duration?: number;
  interventions?: string | null;
  progress?: string | null;
  painLevel?: number | null;
  notes?: string | null;
}

export interface SessionsResponse {
  sessions: TreatmentSession[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const sessionService = {
  getAll: async (params?: {
    patientId?: string;
    therapistId?: string;
    treatmentPlanId?: string;
    appointmentId?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<SessionsResponse> => {
    const response = await api.get<{ success: boolean; data: SessionsResponse }>(
      '/sessions',
      { params }
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<TreatmentSession> => {
    const response = await api.get<{ success: boolean; data: TreatmentSession }>(
      `/sessions/${id}`
    );
    return response.data.data;
  },

  create: async (data: CreateSessionData): Promise<TreatmentSession> => {
    const response = await api.post<{ success: boolean; data: TreatmentSession }>(
      '/sessions',
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: UpdateSessionData): Promise<TreatmentSession> => {
    const response = await api.put<{ success: boolean; data: TreatmentSession }>(
      `/sessions/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },

  confirmAttendance: async (
    sessionId: string,
    data: {
      attendanceStatus: 'ATTENDED' | 'NOT_ATTENDED' | 'RESCHEDULED';
      notes?: string;
    }
  ): Promise<TreatmentSession> => {
    const response = await api.patch<{ success: boolean; data: TreatmentSession }>(
      `/sessions/${sessionId}/attendance`,
      data
    );
    return response.data.data;
  },
};
