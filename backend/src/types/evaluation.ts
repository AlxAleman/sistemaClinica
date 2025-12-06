export interface Evaluation {
  id: string;
  patientId: string;
  evaluationType: 'INITIAL' | 'PROGRESS' | 'FINAL';
  evaluationDate: Date;
  rangeOfMotion?: string | null;
  strength?: string | null;
  painLevel?: number | null;
  functionalAssessment?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
  };
}

export interface CreateEvaluationData {
  patientId: string;
  evaluationType: 'INITIAL' | 'PROGRESS' | 'FINAL';
  evaluationDate: string; // ISO datetime string
  rangeOfMotion?: string | null;
  strength?: string | null;
  painLevel?: number | null;
  functionalAssessment?: string | null;
  notes?: string | null;
}

export interface UpdateEvaluationData {
  patientId?: string;
  evaluationType?: 'INITIAL' | 'PROGRESS' | 'FINAL';
  evaluationDate?: string;
  rangeOfMotion?: string | null;
  strength?: string | null;
  painLevel?: number | null;
  functionalAssessment?: string | null;
  notes?: string | null;
}

export interface EvaluationComparison {
  initial?: Evaluation;
  final?: Evaluation;
  progress?: Evaluation[];
  improvements?: {
    painLevel?: number; // Diferencia en nivel de dolor
    rangeOfMotion?: string;
    strength?: string;
    functionalAssessment?: string;
  };
}

