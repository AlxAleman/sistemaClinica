import api from './api';

export interface MedicalProfile {
  id: string;
  patientId: string;
  previousCondition?: string | null;
  currentCondition?: string | null;
  generalObservations?: string | null;
  allergies?: string | null;
  currentMedications?: string | null;
  medicalHistory?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpedienteDiagnosis {
  id: string;
  patientId: string;
  clinicalDiagnosis: string;
  diagnosisDate: string;
  observations?: string | null;
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
  createdAt: string;
  updatedAt: string;
  treatmentPlans?: {
    id: string;
    title: string;
    status: string;
    sessionsPlanned: number;
    sessionsCompleted: number;
  }[];
}

export interface ExpedienteSession {
  id: string;
  sessionDate: string;
  sessionNumber?: number | null;
  attendanceStatus?: 'ATTENDED' | 'NOT_ATTENDED' | 'PENDING' | 'RESCHEDULED' | null;
  treatmentPlan?: { id: string; title: string } | null;
  therapist?: { id: string; name: string } | null;
}

export interface ExpedientePayment {
  id: string;
  paymentDate: string;
  amount: number;
  method: 'CASH' | 'POS' | 'TRANSFER';
  status: 'PAID' | 'PENDING' | 'CANCELLED';
}

export interface TherapistNote {
  id: string;
  content: string;
  createdAt: string;
  therapist?: { id: string; name: string } | null;
}

export interface ExpedienteDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  description?: string | null;
  uploadedAt: string;
}

export interface ExpedienteSummary {
  totalSessions: number;
  attendedSessions: number;
  pendingSessions: number;
  totalPaid: number;
  activeTreatmentPlans: number;
}

export interface Expediente {
  patient: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    status?: 'ACTIVE' | 'INACTIVE' | null;
    photoUrl?: string | null;
    gender?: string | null;
  };
  medicalProfile: MedicalProfile | null;
  diagnoses: ExpedienteDiagnosis[];
  therapistNotes: TherapistNote[];
  sessions: ExpedienteSession[];
  payments: ExpedientePayment[];
  documents: ExpedienteDocument[];
  summary: ExpedienteSummary;
}

export const expedienteService = {
  getByPatient: async (patientId: string): Promise<Expediente> => {
    const response = await api.get<{ success: boolean; data: Expediente }>(
      `/expediente/${patientId}`
    );
    return response.data.data;
  },

  updateMedicalProfile: async (
    patientId: string,
    data: Partial<Omit<MedicalProfile, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>>
  ): Promise<MedicalProfile> => {
    const response = await api.put<{ success: boolean; data: MedicalProfile }>(
      `/expediente/${patientId}/medical-profile`,
      data
    );
    return response.data.data;
  },
};
