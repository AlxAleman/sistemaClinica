export interface CreatePaymentData {
  patientId: string;
  sessionId?: string | null;
  treatmentPlanId?: string | null;
  amount: number;
  paymentDate?: string | null;
  method?: 'CASH' | 'POS' | 'TRANSFER';
  notes?: string | null;
}

export interface UpdatePaymentData extends Partial<CreatePaymentData> {
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}
