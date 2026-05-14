export type AttendanceStatus = 'PENDING' | 'ATTENDED' | 'NOT_ATTENDED' | 'RESCHEDULED';

export interface TreatmentSession {
  id: string;
  patientId: string;
  therapistId: string | null;
  treatmentPlanId?: string | null;
  appointmentId?: string | null;
  sessionDate: string;
  sessionNumber?: number | null;
  duration: number;
  attendanceStatus: AttendanceStatus;
  attendanceConfirmedAt?: string | null;
  interventions?: string | null;
  progress?: string | null;
  painLevel?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: { id: string; name: string; phone: string; email?: string | null };
  therapist?: { id: string; name: string; specialization?: string | null };
}

export interface CreateSessionData {
  patientId: string;
  therapistId?: string | null;
  treatmentPlanId?: string | null;
  appointmentId?: string | null;
  sessionDate: string;
  sessionNumber?: number | null;
  duration?: number;
  attendanceStatus?: AttendanceStatus;
  interventions?: string | null;
  progress?: string | null;
  painLevel?: number | null;
  notes?: string | null;
  sessionProtocol?: any[] | null;
}

export interface UpdateSessionData {
  patientId?: string;
  therapistId?: string | null;
  treatmentPlanId?: string | null;
  appointmentId?: string | null;
  sessionDate?: string;
  sessionNumber?: number | null;
  duration?: number;
  attendanceStatus?: AttendanceStatus;
  interventions?: string | null;
  progress?: string | null;
  painLevel?: number | null;
  notes?: string | null;
  sessionProtocol?: any[] | null;
}
