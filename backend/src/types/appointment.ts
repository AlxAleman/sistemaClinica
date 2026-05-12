export interface Appointment {
  id: string;
  patientId: string;
  therapistId: string | null;
  appointmentDate: string;
  duration: number;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  googleEventClinic?: string | null;
  googleEventPatient?: string | null;
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
  duration?: number; // en minutos, default 60
}

export interface UpdateAppointmentData {
  patientId?: string;
  therapistId?: string | null;
  appointmentDate?: string;
  duration?: number;
  status?: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}
