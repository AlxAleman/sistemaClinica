import prisma from '../config/database';
import { CreatePaymentData, UpdatePaymentData } from '../types/payment';

export const createPayment = async (data: CreatePaymentData) => {
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  if (data.sessionId) {
    const session = await prisma.treatmentSession.findUnique({
      where: { id: data.sessionId },
    });

    if (!session) {
      throw new Error('Sesión no encontrada');
    }
  }

  const payment = await prisma.payment.create({
    data: {
      patientId: data.patientId,
      sessionId: data.sessionId || null,
      treatmentPlanId: data.treatmentPlanId || null,
      amount: data.amount,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      method: data.method || 'CASH',
      notes: data.notes || null,
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      invoice: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return payment;
};

export const getPayments = async (filters: {
  patientId?: string;
  treatmentPlanId?: string;
  method?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const {
    patientId,
    treatmentPlanId,
    method,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters;

  const skip = (page - 1) * limit;
  const where: any = {};

  if (patientId) {
    where.patientId = patientId;
  }

  if (treatmentPlanId) {
    where.treatmentPlanId = treatmentPlanId;
  }

  if (method) {
    where.method = method;
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) {
      where.paymentDate.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.paymentDate.lte = end;
    }
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        invoice: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPaymentById = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      session: true,
      treatmentPlan: {
        select: {
          id: true,
          title: true,
        },
      },
      invoice: true,
    },
  });

  if (!payment) {
    throw new Error('Pago no encontrado');
  }

  return payment;
};

export const getPaymentsByPatient = async (patientId: string) => {
  const payments = await prisma.payment.findMany({
    where: { patientId },
    orderBy: { paymentDate: 'desc' },
    include: {
      invoice: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return payments;
};

export const updatePayment = async (id: string, data: UpdatePaymentData) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new Error('Pago no encontrado');
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      patientId: data.patientId,
      sessionId: data.sessionId,
      treatmentPlanId: data.treatmentPlanId,
      amount: data.amount,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      method: data.method,
      status: data.status,
      notes: data.notes,
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      invoice: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return updated;
};

export const deletePayment = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new Error('Pago no encontrado');
  }

  await prisma.payment.delete({
    where: { id },
  });
};

export const getPaymentSummary = async (startDate?: string, endDate?: string) => {
  const where: any = { status: 'COMPLETED' };

  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) {
      where.paymentDate.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.paymentDate.lte = end;
    }
  }

  const [completedPayments, pendingCount] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: {
        amount: true,
        method: true,
      },
    }),
    prisma.payment.count({
      where: {
        ...(where.paymentDate ? { paymentDate: where.paymentDate } : {}),
        status: 'PENDING',
      },
    }),
  ]);

  const totalAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCount = completedPayments.length;

  const byMethod = {
    CASH: completedPayments
      .filter((p) => p.method === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0),
    POS: completedPayments
      .filter((p) => p.method === 'POS')
      .reduce((sum, p) => sum + p.amount, 0),
    TRANSFER: completedPayments
      .filter((p) => p.method === 'TRANSFER')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return {
    totalAmount,
    byMethod,
    totalCount,
    pendingCount,
  };
};
