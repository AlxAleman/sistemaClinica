import prisma from '../config/database';
import { CreateTreatmentPlanData, UpdateTreatmentPlanData } from '../types/treatmentPlan';

export const createTreatmentPlan = async (data: CreateTreatmentPlanData) => {
  // Verificar que el paciente existe
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  // Calcular costo total si no se proporciona (opcional: se puede calcular basado en sesiones)
  // Por ahora, si no se proporciona totalCost, se deja como null

  // Crear el plan de tratamiento
  const treatmentPlan = await prisma.treatmentPlan.create({
    data: {
      patientId: data.patientId,
      title: data.title,
      description: data.description || null,
      diagnosis: data.diagnosis || null,
      goals: data.goals || null,
      sessionsPlanned: data.sessionsPlanned,
      sessionsCompleted: 0,
      totalCost: data.totalCost || null,
      status: data.status || 'DRAFT',
      approvedByPatient: false,
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return treatmentPlan;
};

export const getTreatmentPlans = async (filters: {
  patientId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { patientId, status, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (patientId) {
    where.patientId = patientId;
  }

  if (status) {
    where.status = status;
  }

  const [treatmentPlans, total] = await Promise.all([
    prisma.treatmentPlan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    prisma.treatmentPlan.count({ where }),
  ]);

  return {
    treatmentPlans,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTreatmentPlanById = async (id: string) => {
  const treatmentPlan = await prisma.treatmentPlan.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!treatmentPlan) {
    throw new Error('Plan de tratamiento no encontrado');
  }

  return treatmentPlan;
};

export const updateTreatmentPlan = async (id: string, data: UpdateTreatmentPlanData) => {
  const treatmentPlan = await prisma.treatmentPlan.findUnique({
    where: { id },
  });

  if (!treatmentPlan) {
    throw new Error('Plan de tratamiento no encontrado');
  }

  // Si se actualiza el paciente, verificar que existe
  if (data.patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error('Paciente no encontrado');
    }
  }

  const updatedTreatmentPlan = await prisma.treatmentPlan.update({
    where: { id },
    data: {
      patientId: data.patientId,
      title: data.title,
      description: data.description,
      diagnosis: data.diagnosis,
      goals: data.goals,
      sessionsPlanned: data.sessionsPlanned,
      totalCost: data.totalCost,
      status: data.status,
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return updatedTreatmentPlan;
};

export const deleteTreatmentPlan = async (id: string) => {
  await prisma.treatmentPlan.delete({
    where: { id },
  });
};

export const approveTreatmentPlan = async (id: string) => {
  const treatmentPlan = await prisma.treatmentPlan.findUnique({
    where: { id },
  });

  if (!treatmentPlan) {
    throw new Error('Plan de tratamiento no encontrado');
  }

  // Actualizar el plan: aprobar y cambiar estado
  const updatedTreatmentPlan = await prisma.treatmentPlan.update({
    where: { id },
    data: {
      approvedByPatient: true,
      approvedAt: new Date(),
      status: 'APPROVED',
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return updatedTreatmentPlan;
};

// Función para actualizar el contador de sesiones completadas
export const updateSessionsCompleted = async (patientId: string) => {
  // Obtener todas las sesiones completadas del paciente
  const sessionsCount = await prisma.treatmentSession.count({
    where: {
      patientId,
    },
  });

  // Actualizar todos los planes del paciente con el nuevo contador
  await prisma.treatmentPlan.updateMany({
    where: {
      patientId,
      status: {
        in: ['APPROVED', 'IN_PROGRESS'],
      },
    },
    data: {
      sessionsCompleted: sessionsCount,
    },
  });
};

