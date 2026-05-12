export interface CreateTherapistNoteData {
  patientId: string;
  therapistId: string;
  sessionId?: string;
  content: string;
}
