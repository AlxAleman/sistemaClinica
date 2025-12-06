export interface DashboardKPIs {
  totalPatients: number;
  activePatients: number; // Pacientes con citas/sesiones en los últimos 30 días
  totalAppointments: number;
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  totalSessions: number;
  todaySessions: number;
  weekSessions: number;
  monthSessions: number;
  attendanceRate: number; // Tasa de asistencia (%)
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
    painReduction?: number; // Diferencia en dolor
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

