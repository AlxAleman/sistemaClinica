import api from './api';

export type PaymentMethod = 'CASH' | 'POS' | 'TRANSFER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Payment {
  id: string;
  patientId: string;
  sessionId?: string | null;
  treatmentPlanId?: string | null;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  status: PaymentStatus;
  notes?: string | null;
  createdAt: string;
  patient?: { name: string; phone: string };
  treatmentPlan?: { title: string } | null;
}

export interface CreatePaymentData {
  patientId: string;
  sessionId?: string | null;
  treatmentPlanId?: string | null;
  amount: number;
  paymentDate?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  notes?: string | null;
}

export interface PaymentSummary {
  totalAmount: number;
  byMethod: { CASH: number; POS: number; TRANSFER: number };
  totalCount: number;
  pendingCount: number;
}

export interface PaymentsResponse {
  payments: Payment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const paymentService = {
  getByPatient: async (patientId: string): Promise<Payment[]> => {
    const response = await api.get<{ success: boolean; data: Payment[] }>(
      `/payments/patient/${patientId}`
    );
    return response.data.data;
  },

  getAll: async (params?: {
    patientId?: string;
    method?: PaymentMethod;
    status?: PaymentStatus;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaymentsResponse> => {
    const response = await api.get<{ success: boolean; data: PaymentsResponse }>(
      '/payments',
      { params }
    );
    return response.data.data;
  },

  getSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PaymentSummary> => {
    const response = await api.get<{ success: boolean; data: PaymentSummary }>(
      '/payments/summary',
      { params }
    );
    return response.data.data;
  },

  create: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await api.post<{ success: boolean; data: Payment }>(
      '/payments',
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreatePaymentData>): Promise<Payment> => {
    const response = await api.put<{ success: boolean; data: Payment }>(
      `/payments/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },
};
