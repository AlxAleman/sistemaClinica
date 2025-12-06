export interface TreatmentSession {
  id: string;
  patientId: string;
  therapistId: string;
  appointmentId?: string | null;
  sessionDate: string;
  duration: number;
  interventions?: string | null;
  progress?: string | null;
  painLevel?: number | null;
  notes?: string | null;
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
  sessionDate: string; // ISO datetime string
  duration?: number; // en minutos, default 60
  interventions?: string | null;
  progress?: string | null;
  painLevel?: number | null;
  notes?: string | null;
}

export interface UpdateSessionData {
  patientId?: string;
  therapistId?: string;
  appointmentId?: string | null;
  sessionDate?: string;
  duration?: number;
  interventions?: string | null;
  progress?: string | null;
  painLevel?: number | null;
  notes?: string | null;
}

