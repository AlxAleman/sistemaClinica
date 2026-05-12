import prisma from '../config/database';

export const createInvoice = async (paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error('Pago no encontrado');
  }

  const existing = await prisma.invoice.findUnique({
    where: { paymentId },
  });

  if (existing) {
    throw new Error('Ya existe una factura para este pago');
  }

  const invoice = await prisma.invoice.create({
    data: {
      paymentId,
      patientId: payment.patientId,
      requested: true,
      status: 'REQUESTED',
      requestedAt: new Date(),
    },
    include: {
      payment: {
        select: {
          id: true,
          amount: true,
          method: true,
          paymentDate: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return invoice;
};

export const getInvoiceByPayment = async (paymentId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { paymentId },
    include: {
      payment: {
        select: {
          id: true,
          amount: true,
          method: true,
          paymentDate: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error('Factura no encontrada');
  }

  return invoice;
};

export const getInvoicesByPatient = async (patientId: string) => {
  const invoices = await prisma.invoice.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      payment: {
        select: {
          id: true,
          amount: true,
          method: true,
          paymentDate: true,
        },
      },
    },
  });

  return invoices;
};

export const updateInvoiceStatus = async (
  id: string,
  status: string,
  externalRef?: string
) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    throw new Error('Factura no encontrada');
  }

  const updateData: any = { status };

  if (externalRef !== undefined) {
    updateData.externalRef = externalRef;
  }

  if (status === 'GENERATED') {
    updateData.generated = true;
    updateData.generatedAt = new Date();
  }

  if (status === 'REQUESTED') {
    updateData.requested = true;
    updateData.requestedAt = new Date();
  }

  if (status === 'CANCELLED') {
    updateData.generated = false;
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: updateData,
    include: {
      payment: {
        select: {
          id: true,
          amount: true,
          method: true,
          paymentDate: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return updated;
};
