export interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  goals?: string | null;
  sessionsPlanned: number;
  sessionsCompleted: number;
  totalCost?: number | null;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  approvedByPatient: boolean;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
  };
}

export interface CreateTreatmentPlanData {
  patientId: string;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  goals?: string | null;
  sessionsPlanned: number;
  totalCost?: number | null;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface UpdateTreatmentPlanData {
  patientId?: string;
  title?: string;
  description?: string | null;
  diagnosis?: string | null;
  goals?: string | null;
  sessionsPlanned?: number;
  totalCost?: number | null;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

