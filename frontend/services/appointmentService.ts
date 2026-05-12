import api from './api';

export interface Appointment {
  id: string;
  patientId: string;
  therapistId: string | null;
  appointmentDate: string;
  duration: number;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  googleEventClinic?: string | null;
  googleEventPatient?: string | null;
  notes?: string | null;
  treatmentPlanId?: string | null;
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
  } | null;
}

export interface CreateAppointmentData {
  patientId: string;
  therapistId?: string | null;
  appointmentDate: string; // ISO datetime string
  duration?: number;
  notes?: string | null;
  treatmentPlanId?: string | null;
}

export interface UpdateAppointmentData {
  patientId?: string;
  therapistId?: string | null;
  appointmentDate?: string;
  duration?: number;
  status?: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string | null;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const appointmentService = {
  getAll: async (params?: {
    patientId?: string;
    therapistId?: string;
    date?: string;
    status?: string;
    page?: number;
    limit?: number;
    unassigned?: boolean;
  }): Promise<AppointmentsResponse> => {
    const response = await api.get<{ success: boolean; data: AppointmentsResponse }>(
      '/appointments',
      { params }
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const response = await api.get<{ success: boolean; data: Appointment }>(
      `/appointments/${id}`
    );
    return response.data.data;
  },

  create: async (data: CreateAppointmentData): Promise<Appointment> => {
    const response = await api.post<{ success: boolean; data: Appointment }>(
      '/appointments',
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: UpdateAppointmentData): Promise<Appointment> => {
    const response = await api.put<{ success: boolean; data: Appointment }>(
      `/appointments/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  confirm: async (id: string): Promise<Appointment> => {
    const response = await api.post<{ success: boolean; data: Appointment }>(
      `/appointments/${id}/confirm`
    );
    return response.data.data;
  },

  claim: async (id: string): Promise<Appointment> => {
    const response = await api.post<{ success: boolean; data: Appointment }>(
      `/appointments/${id}/claim`
    );
    return response.data.data;
  },
};
