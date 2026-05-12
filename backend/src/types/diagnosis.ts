export interface CreateDiagnosisData {
  patientId: string;
  clinicalDiagnosis: string;
  diagnosisDate?: string | Date;
  observations?: string | null;
  status?: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
}

export interface UpdateDiagnosisData {
  clinicalDiagnosis?: string;
  diagnosisDate?: string | Date;
  observations?: string | null;
  status?: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
}
