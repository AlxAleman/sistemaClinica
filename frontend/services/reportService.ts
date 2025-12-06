import api from './api';

export interface DashboardKPIs {
  totalPatients: number;
  activePatients: number;
  totalAppointments: number;
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  totalSessions: number;
  todaySessions: number;
  weekSessions: number;
  monthSessions: number;
  attendanceRate: number;
  revenue: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  appointmentsByStatus: {
    scheduled: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
}

export interface PatientReport {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  totalAppointments: number;
  completedAppointments: number;
  totalSessions: number;
  totalEvaluations: number;
  totalTreatmentPlans: number;
  lastAppointment?: string | null;
  lastSession?: string | null;
  status: 'active' | 'inactive';
}

export interface SessionReport {
  id: string;
  patientName: string;
  therapistName: string;
  sessionDate: string;
  duration: number;
  painLevel?: number | null;
  status: 'completed' | 'cancelled';
}

export interface ClinicalProgressReport {
  patientId: string;
  patientName: string;
  initialEvaluation?: {
    date: string;
    painLevel?: number | null;
  };
  finalEvaluation?: {
    date: string;
    painLevel?: number | null;
  };
  progress: {
    painReduction?: number;
    sessionsCompleted: number;
    sessionsPlanned: number;
    completionRate: number;
  };
  treatmentPlans: {
    total: number;
    completed: number;
    inProgress: number;
  };
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  patientId?: string;
  therapistId?: string;
  status?: string;
}

export const reportService = {
  getDashboardKPIs: async (): Promise<DashboardKPIs> => {
    const response = await api.get<{ success: boolean; data: DashboardKPIs }>(
      '/reports/dashboard'
    );
    return response.data.data;
  },

  getPatientReport: async (filters?: ReportFilters): Promise<PatientReport[]> => {
    const response = await api.get<{ success: boolean; data: PatientReport[] }>(
      '/reports/patients',
      { params: filters }
    );
    return response.data.data;
  },

  getSessionReport: async (filters?: ReportFilters): Promise<SessionReport[]> => {
    const response = await api.get<{ success: boolean; data: SessionReport[] }>(
      '/reports/sessions',
      { params: filters }
    );
    return response.data.data;
  },

  getClinicalProgressReport: async (filters?: ReportFilters): Promise<ClinicalProgressReport[]> => {
    const response = await api.get<{ success: boolean; data: ClinicalProgressReport[] }>(
      '/reports/clinical-progress',
      { params: filters }
    );
    return response.data.data;
  },

  exportReport: async (type: string, filters?: ReportFilters): Promise<Blob> => {
    const response = await api.get(`/reports/export/${type}`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};

