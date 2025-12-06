import prisma from '../config/database';
import { CreateSessionData, UpdateSessionData } from '../types/session';
import { updateSessionsCompleted } from './treatmentPlanService';

export const createSession = async (data: CreateSessionData) => {
  // Verificar que el paciente existe
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  // Verificar que el terapeuta existe
  const therapist = await prisma.therapist.findUnique({
    where: { id: data.therapistId },
  });

  if (!therapist) {
    throw new Error('Terapeuta no encontrado');
  }

  // Si hay appointmentId, verificar que existe
  if (data.appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
    });

    if (!appointment) {
      throw new Error('Cita no encontrada');
    }
  }

  // Crear la sesión
  const session = await prisma.treatmentSession.create({
    data: {
      patientId: data.patientId,
      therapistId: data.therapistId,
      appointmentId: data.appointmentId || null,
      sessionDate: new Date(data.sessionDate),
      duration: data.duration || 60,
      interventions: data.interventions || null,
      progress: data.progress || null,
      painLevel: data.painLevel || null,
      notes: data.notes || null,
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      therapist: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
    },
  });

  // Actualizar contador de sesiones en planes de tratamiento
  try {
    await updateSessionsCompleted(data.patientId);
    
    // Si es la primera sesión, cambiar el estado del plan a IN_PROGRESS
    const plans = await prisma.treatmentPlan.findMany({
      where: {
        patientId: data.patientId,
        status: 'APPROVED',
      },
    });

    for (const plan of plans) {
      const sessionsCount = await prisma.treatmentSession.count({
        where: {
          patientId: data.patientId,
        },
      });

      if (sessionsCount === 1 && plan.status === 'APPROVED') {
        await prisma.treatmentPlan.update({
          where: { id: plan.id },
          data: { status: 'IN_PROGRESS' },
        });
      }

      // Si se completaron todas las sesiones, cambiar a COMPLETED
      if (sessionsCount >= plan.sessionsPlanned && plan.status === 'IN_PROGRESS') {
        await prisma.treatmentPlan.update({
          where: { id: plan.id },
          data: { status: 'COMPLETED' },
        });
      }
    }
  } catch (error) {
    // No fallar si hay error actualizando los planes
    console.error('Error actualizando planes de tratamiento:', error);
  }

  return session;
};

export const getSessions = async (filters: {
  patientId?: string;
  therapistId?: string;
  appointmentId?: string;
  date?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}) => {
  const { patientId, therapistId, appointmentId, date, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (patientId) {
    where.patientId = patientId;
  }

  if (therapistId) {
    where.therapistId = therapistId;
  }

  if (appointmentId) {
    where.appointmentId = appointmentId;
  }

  if (date) {
    // Parsear la fecha en formato YYYY-MM-DD y crear fechas en zona horaria local
    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    where.sessionDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  const [sessions, total] = await Promise.all([
    prisma.treatmentSession.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sessionDate: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
    }),
    prisma.treatmentSession.count({ where }),
  ]);

  return {
    sessions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSessionById = async (id: string) => {
  const session = await prisma.treatmentSession.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      therapist: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error('Sesión no encontrada');
  }

  return session;
};

export const updateSession = async (id: string, data: UpdateSessionData) => {
  const session = await prisma.treatmentSession.findUnique({
    where: { id },
  });

  if (!session) {
    throw new Error('Sesión no encontrada');
  }

  const updatedSession = await prisma.treatmentSession.update({
    where: { id },
    data: {
      patientId: data.patientId,
      therapistId: data.therapistId,
      appointmentId: data.appointmentId,
      sessionDate: data.sessionDate ? new Date(data.sessionDate) : undefined,
      duration: data.duration,
      interventions: data.interventions,
      progress: data.progress,
      painLevel: data.painLevel,
      notes: data.notes,
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      therapist: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
    },
  });

  return updatedSession;
};

export const deleteSession = async (id: string) => {
  // Obtener la sesión antes de eliminarla para actualizar los planes
  const session = await prisma.treatmentSession.findUnique({
    where: { id },
    select: { patientId: true },
  });

  if (!session) {
    throw new Error('Sesión no encontrada');
  }

  // Eliminar la sesión
  await prisma.treatmentSession.delete({
    where: { id },
  });

  // Actualizar contador de sesiones en planes de tratamiento
  try {
    await updateSessionsCompleted(session.patientId);
  } catch (error) {
    // No fallar si hay error actualizando los planes
    console.error('Error actualizando planes de tratamiento:', error);
  }
};

