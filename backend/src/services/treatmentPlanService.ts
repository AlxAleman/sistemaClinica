import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { CreateTreatmentPlanData, UpdateTreatmentPlanData } from '../types/treatmentPlan';

export const createTreatmentPlan = async (data: CreateTreatmentPlanData) => {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new Error('Paciente no encontrado');

  if (data.diagnosisId) {
    const diagnosis = await prisma.diagnosis.findUnique({ where: { id: data.diagnosisId } });
    if (!diagnosis) throw new Error('Diagnóstico no encontrado');
  }

  const treatmentPlan = await prisma.treatmentPlan.create({
    data: {
      patientId: data.patientId,
      diagnosisId: data.diagnosisId || null,
      episodeId: data.episodeId || null,
      title: data.title,
      therapyType: data.therapyType || null,
      description: data.description || null,
      goals: data.goals || null,
      frequency: data.frequency || null,
      sessionDuration: data.sessionDuration || null,
      sessionsPlanned: data.sessionsPlanned,
      sessionsCompleted: 0,
      protocol: (data.protocol ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
      totalCost: data.totalCost || null,
      status: data.status || 'DRAFT',
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      diagnosis: { select: { id: true, clinicalDiagnosis: true, status: true } },
    },
  });

  return {
    ...treatmentPlan,
    sessionsRemaining: treatmentPlan.sessionsPlanned - treatmentPlan.sessionsCompleted,
  };
};

export const getTreatmentPlans = async (filters: {
  patientId?: string;
  diagnosisId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { patientId, diagnosisId, status, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;
  const where: any = {};

  if (patientId) where.patientId = patientId;
  if (diagnosisId) where.diagnosisId = diagnosisId;
  if (status) where.status = status;

  const [treatmentPlans, total] = await Promise.all([
    prisma.treatmentPlan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        diagnosis: { select: { id: true, clinicalDiagnosis: true, status: true } },
        _count: { select: { sessions: true } },
      },
    }),
    prisma.treatmentPlan.count({ where }),
  ]);

  return {
    treatmentPlans: treatmentPlans.map(p => ({
      ...p,
      sessionsRemaining: p.sessionsPlanned - p.sessionsCompleted,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getTreatmentPlanById = async (id: string) => {
  const treatmentPlan = await prisma.treatmentPlan.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      diagnosis: { select: { id: true, clinicalDiagnosis: true, observations: true, status: true } },
      sessions: {
        orderBy: { sessionDate: 'desc' },
        include: { therapist: { select: { id: true, name: true } } },
      },
      payments: { orderBy: { paymentDate: 'desc' } },
    },
  });

  if (!treatmentPlan) throw new Error('Plan de tratamiento no encontrado');

  return {
    ...treatmentPlan,
    sessionsRemaining: treatmentPlan.sessionsPlanned - treatmentPlan.sessionsCompleted,
  };
};

export const updateTreatmentPlan = async (id: string, data: UpdateTreatmentPlanData) => {
  const treatmentPlan = await prisma.treatmentPlan.findUnique({ where: { id } });
  if (!treatmentPlan) throw new Error('Plan de tratamiento no encontrado');

  if (data.patientId) {
    const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
    if (!patient) throw new Error('Paciente no encontrado');
  }

  if (data.diagnosisId) {
    const diagnosis = await prisma.diagnosis.findUnique({ where: { id: data.diagnosisId } });
    if (!diagnosis) throw new Error('Diagnóstico no encontrado');
  }

  const updated = await prisma.treatmentPlan.update({
    where: { id },
    data: {
      patientId: data.patientId,
      diagnosisId: data.diagnosisId,
      title: data.title,
      therapyType: data.therapyType,
      description: data.description,
      goals: data.goals,
      frequency: data.frequency,
      sessionDuration: data.sessionDuration,
      sessionsPlanned: data.sessionsPlanned,
      ...(data.protocol !== undefined && {
        protocol: (data.protocol ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
      }),
      totalCost: data.totalCost,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      diagnosis: { select: { id: true, clinicalDiagnosis: true, status: true } },
    },
  });

  return { ...updated, sessionsRemaining: updated.sessionsPlanned - updated.sessionsCompleted };
};

export const deleteTreatmentPlan = async (id: string) => {
  await prisma.treatmentPlan.delete({ where: { id } });
};

export const approveTreatmentPlan = async (id: string) => {
  const plan = await prisma.treatmentPlan.findUnique({ where: { id } });
  if (!plan) throw new Error('Plan de tratamiento no encontrado');

  return prisma.treatmentPlan.update({
    where: { id },
    data: { status: 'ACTIVE', startDate: new Date() },
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      diagnosis: { select: { id: true, clinicalDiagnosis: true } },
    },
  });
};

// Confirma asistencia de sesión y actualiza contador del plan
export const updateSessionsCompleted = async (treatmentPlanId: string) => {
  const count = await prisma.treatmentSession.count({
    where: { treatmentPlanId, attendanceStatus: 'ATTENDED' },
  });

  const plan = await prisma.treatmentPlan.update({
    where: { id: treatmentPlanId },
    data: {
      sessionsCompleted: count,
      status: count > 0 ? 'ACTIVE' : undefined,
    },
  });

  return plan;
};

// Recalcula los contadores de TODOS los planes — se llama al arrancar el servidor
export const recalculateAllCounters = async () => {
  const plans = await prisma.treatmentPlan.findMany({ select: { id: true } });
  await Promise.allSettled(plans.map(p => updateSessionsCompleted(p.id)));
};
