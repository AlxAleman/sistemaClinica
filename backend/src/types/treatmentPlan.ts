export type TreatmentPlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface ProtocolItem {
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
  notes?: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  diagnosisId?: string | null;
  title: string;
  therapyType?: string | null;
  description?: string | null;
  goals?: string | null;
  frequency?: string | null;
  sessionDuration?: number | null;
  sessionsPlanned: number;
  sessionsCompleted: number;
  protocol?: ProtocolItem[] | null;
  totalCost?: number | null;
  status: TreatmentPlanStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: { id: string; name: string; email?: string | null; phone: string };
  diagnosis?: { id: string; clinicalDiagnosis: string; status: string } | null;
}

export interface CreateTreatmentPlanData {
  patientId: string;
  diagnosisId?: string | null;
  episodeId?: string | null;
  title: string;
  therapyType?: string | null;
  description?: string | null;
  goals?: string | null;
  frequency?: string | null;
  sessionDuration?: number | null;
  sessionsPlanned: number;
  protocol?: ProtocolItem[] | null;
  totalCost?: number | null;
  status?: TreatmentPlanStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateTreatmentPlanData {
  patientId?: string;
  diagnosisId?: string | null;
  title?: string;
  therapyType?: string | null;
  description?: string | null;
  goals?: string | null;
  frequency?: string | null;
  sessionDuration?: number | null;
  sessionsPlanned?: number;
  protocol?: ProtocolItem[] | null;
  totalCost?: number | null;
  status?: TreatmentPlanStatus;
  startDate?: string | null;
  endDate?: string | null;
}
