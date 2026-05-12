import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { CreateSessionData, UpdateSessionData } from '../types/session';
import { updateSessionsCompleted } from './treatmentPlanService';

export const createSession = async (data: CreateSessionData) => {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new Error('Paciente no encontrado');

  const therapist = await prisma.therapist.findUnique({ where: { id: data.therapistId } });
  if (!therapist) throw new Error('Terapeuta no encontrado');

  if (data.appointmentId) {
    const appointment = await prisma.appointment.findUnique({ where: { id: data.appointmentId } });
    if (!appointment) throw new Error('Cita no encontrada');
  }

  if (data.treatmentPlanId) {
    const plan = await prisma.treatmentPlan.findUnique({ where: { id: data.treatmentPlanId } });
    if (!plan) throw new Error('Plan de tratamiento no encontrado');
  }

  // Calcular número de sesión automáticamente si hay plan vinculado
  let sessionNumber = data.sessionNumber || null;
  if (data.treatmentPlanId && !sessionNumber) {
    const count = await prisma.treatmentSession.count({ where: { treatmentPlanId: data.treatmentPlanId } });
    sessionNumber = count + 1;
  }

  const session = await prisma.treatmentSession.create({
    data: {
      patientId: data.patientId,
      therapistId: data.therapistId,
      treatmentPlanId: data.treatmentPlanId || null,
      appointmentId: data.appointmentId || null,
      sessionDate: new Date(data.sessionDate),
      sessionNumber,
      duration: data.duration || 60,
      attendanceStatus: data.attendanceStatus || 'PENDING',
      interventions: data.interventions || null,
      progress: data.progress || null,
      painLevel: data.painLevel != null ? data.painLevel : null,
      notes: data.notes || null,
      sessionProtocol: data.sessionProtocol ?? Prisma.JsonNull,
    },
    include: {
      patient: { select: { id: true, name: true, phone: true, email: true } },
      therapist: { select: { id: true, name: true, specialization: true } },
      treatmentPlan: { select: { id: true, title: true, sessionsPlanned: true, sessionsCompleted: true } },
    },
  });

  // Actualizar contador si ya se confirmó la asistencia
  if (data.treatmentPlanId && data.attendanceStatus === 'ATTENDED') {
    await updateSessionsCompleted(data.treatmentPlanId);
  }

  return session;
};

export const confirmAttendance = async (
  sessionId: string,
  attendanceStatus: 'ATTENDED' | 'NOT_ATTENDED' | 'RESCHEDULED',
  notes?: string | null
) => {
  const session = await prisma.treatmentSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Sesión no encontrada');

  const updated = await prisma.treatmentSession.update({
    where: { id: sessionId },
    data: {
      attendanceStatus,
      attendanceConfirmedAt: new Date(),
      notes: notes || session.notes,
    },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      therapist: { select: { id: true, name: true } },
      treatmentPlan: { select: { id: true, title: true, sessionsPlanned: true, sessionsCompleted: true } },
    },
  });

  // Actualizar contador del plan vinculado
  if (session.treatmentPlanId) {
    await updateSessionsCompleted(session.treatmentPlanId);
  }

  // Actualizar estado de la cita vinculada
  if (session.appointmentId) {
    await prisma.appointment.update({
      where: { id: session.appointmentId },
      data: {
        status: attendanceStatus === 'ATTENDED' ? 'COMPLETED'
          : attendanceStatus === 'NOT_ATTENDED' ? 'NO_SHOW'
          : 'RESCHEDULED',
      },
    });
  }

  return updated;
};

export const getSessions = async (filters: {
  patientId?: string;
  therapistId?: string;
  treatmentPlanId?: string;
  appointmentId?: string;
  attendanceStatus?: string;
  date?: string;
  page?: number;
  limit?: number;
}) => {
  const { patientId, therapistId, treatmentPlanId, appointmentId, attendanceStatus, date, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;
  const where: any = {};

  if (patientId) where.patientId = patientId;
  if (therapistId) where.therapistId = therapistId;
  if (treatmentPlanId) where.treatmentPlanId = treatmentPlanId;
  if (appointmentId) where.appointmentId = appointmentId;
  if (attendanceStatus) where.attendanceStatus = attendanceStatus;

  if (date) {
    const [year, month, day] = date.split('-').map(Number);
    where.sessionDate = {
      gte: new Date(year, month - 1, day, 0, 0, 0),
      lte: new Date(year, month - 1, day, 23, 59, 59),
    };
  }

  const [sessions, total] = await Promise.all([
    prisma.treatmentSession.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sessionDate: 'desc' },
      include: {
        patient: { select: { id: true, name: true, phone: true, email: true } },
        therapist: { select: { id: true, name: true, specialization: true } },
        treatmentPlan: { select: { id: true, title: true, sessionsPlanned: true, sessionsCompleted: true } },
      },
    }),
    prisma.treatmentSession.count({ where }),
  ]);

  return {
    sessions: sessions.map(s => ({
      ...s,
      sessionsRemaining: s.treatmentPlan
        ? s.treatmentPlan.sessionsPlanned - s.treatmentPlan.sessionsCompleted
        : null,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getSessionById = async (id: string) => {
  const session = await prisma.treatmentSession.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true, phone: true, email: true } },
      therapist: { select: { id: true, name: true, specialization: true } },
      treatmentPlan: { select: { id: true, title: true, sessionsPlanned: true, sessionsCompleted: true } },
      appointment: { select: { id: true, appointmentDate: true, status: true } },
    },
  });

  if (!session) throw new Error('Sesión no encontrada');
  return session;
};

export const updateSession = async (id: string, data: UpdateSessionData) => {
  const session = await prisma.treatmentSession.findUnique({ where: { id } });
  if (!session) throw new Error('Sesión no encontrada');

  const updated = await prisma.treatmentSession.update({
    where: { id },
    data: {
      therapistId: data.therapistId,
      treatmentPlanId: data.treatmentPlanId,
      sessionDate: data.sessionDate ? new Date(data.sessionDate) : undefined,
      sessionNumber: data.sessionNumber,
      duration: data.duration,
      attendanceStatus: data.attendanceStatus,
      interventions: data.interventions,
      progress: data.progress,
      painLevel: data.painLevel != null ? data.painLevel : null,
      notes: data.notes,
      ...(data.sessionProtocol !== undefined && {
        sessionProtocol: data.sessionProtocol ?? Prisma.JsonNull,
      }),
    },
    include: {
      patient: { select: { id: true, name: true, phone: true, email: true } },
      therapist: { select: { id: true, name: true, specialization: true } },
      treatmentPlan: { select: { id: true, title: true, sessionsPlanned: true, sessionsCompleted: true } },
    },
  });

  return updated;
};

export const deleteSession = async (id: string) => {
  const session = await prisma.treatmentSession.findUnique({
    where: { id },
    select: { treatmentPlanId: true },
  });
  if (!session) throw new Error('Sesión no encontrada');

  await prisma.treatmentSession.delete({ where: { id } });

  if (session.treatmentPlanId) {
    await updateSessionsCompleted(session.treatmentPlanId).catch(() => {});
  }
};

// Detección de conflictos de terapistas
export const detectScheduleConflicts = async (
  therapistId: string,
  appointmentDate: Date,
  duration: number,
  excludeAppointmentId?: string
) => {
  const appointmentEnd = new Date(appointmentDate.getTime() + duration * 60000);

  const conflicting = await prisma.appointment.findMany({
    where: {
      therapistId,
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
      AND: [
        { appointmentDate: { lt: appointmentEnd } },
        {
          appointmentDate: {
            gte: new Date(appointmentDate.getTime() - 120 * 60000),
          },
        },
      ],
    },
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  // Filtrar los que realmente se solapan
  const overlapping = conflicting.filter(appt => {
    const apptEnd = new Date(appt.appointmentDate.getTime() + appt.duration * 60000);
    return appt.appointmentDate < appointmentEnd && apptEnd > appointmentDate;
  });

  return overlapping;
};
