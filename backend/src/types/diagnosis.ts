export interface CreateDiagnosisData {
  patientId: string;
  clinicalDiagnosis: string;
  diagnosisDate?: string | Date;
  observations?: string | null;
  status?: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
  episodeId?: string | null;
}

export interface UpdateDiagnosisData {
  clinicalDiagnosis?: string;
  diagnosisDate?: string | Date;
  observations?: string | null;
  status?: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
  evaluacionFisicaId?: string | null;
  episodeId?: string | null;
}
