export interface Medication {
  name: string;
  dosage: string; // Ej: "500mg"
  frequency: string; // Ej: "Cada 8 horas"
  duration: string; // Ej: "7 días"
  instructions?: string; // Instrucciones adicionales
}

export interface Prescription {
  id: string;
  patientId: string;
  therapistId?: string | null;
  prescriptionDate: Date;
  diagnosis?: string | null;
  medications: Medication[];
  instructions?: string | null;
  notes?: string | null;
  printed: boolean;
  printedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
  };
  therapist?: {
    id: string;
    name: string;
    specialization?: string | null;
  } | null;
}

export interface CreatePrescriptionData {
  patientId: string;
  therapistId?: string | null;
  prescriptionDate?: string; // ISO datetime string
  diagnosis?: string | null;
  medications: Medication[];
  instructions?: string | null;
  notes?: string | null;
}

export interface UpdatePrescriptionData {
  patientId?: string;
  therapistId?: string | null;
  prescriptionDate?: string;
  diagnosis?: string | null;
  medications?: Medication[];
  instructions?: string | null;
  notes?: string | null;
}

export interface PrescriptionsResponse {
  prescriptions: Prescription[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

