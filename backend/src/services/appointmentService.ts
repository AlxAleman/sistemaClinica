import prisma from '../config/database';
import { CreateAppointmentData, UpdateAppointmentData } from '../types/appointment';

const THERAPIST_INCLUDE = {
  patient: {
    select: { id: true, name: true, phone: true, email: true },
  },
  therapist: {
    select: { id: true, name: true, specialization: true },
  },
} as const;

async function validateTherapistAvailability(
  therapistId: string,
  appointmentDate: Date,
  duration: number,
  excludeAppointmentId?: string
) {
  const therapist = await prisma.therapist.findUnique({ where: { id: therapistId } });
  if (!therapist) throw new Error('Terapeuta no encontrado');

  const dayOfWeek = appointmentDate.getDay();
  const appointmentTime = appointmentDate.toTimeString().slice(0, 5);

  const availability = await prisma.therapistAvailability.findFirst({
    where: { therapistId, dayOfWeek, isAvailable: true },
  });

  if (!availability) {
    throw new Error('El terapeuta no está disponible en este día');
  }

  if (appointmentTime < availability.startTime || appointmentTime >= availability.endTime) {
    throw new Error(`El terapeuta solo está disponible de ${availability.startTime} a ${availability.endTime}`);
  }

  const endTime = new Date(appointmentDate.getTime() + duration * 60000);

  const conflict = await prisma.appointment.findFirst({
    where: {
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      therapistId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      appointmentDate: { gte: appointmentDate, lt: endTime },
    },
  });

  if (conflict) throw new Error('El terapeuta ya tiene una cita en este horario');

  // Check overlap from the other side
  const overlapConflict = await prisma.appointment.findFirst({
    where: {
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      therapistId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      AND: [
        { appointmentDate: { lt: appointmentDate } },
        { appointmentDate: { gte: new Date(appointmentDate.getTime() - duration * 60000) } },
      ],
    },
    include: { patient: false },
  });

  if (overlapConflict) {
    const existingEnd = new Date(overlapConflict.appointmentDate.getTime() + overlapConflict.duration * 60000);
    if (existingEnd > appointmentDate) {
      throw new Error('El terapeuta ya tiene una cita que se superpone con este horario');
    }
  }
}

export const createAppointment = async (data: CreateAppointmentData) => {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new Error('Paciente no encontrado');

  const appointmentDate = new Date(data.appointmentDate);
  const duration = data.duration || 60;

  if (data.therapistId) {
    await validateTherapistAvailability(data.therapistId, appointmentDate, duration);
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      therapistId: data.therapistId || null,
      appointmentDate,
      duration,
      status: 'SCHEDULED',
    },
    include: THERAPIST_INCLUDE,
  });

  return appointment;
};

export const getAppointments = async (filters: {
  patientId?: string;
  therapistId?: string;
  date?: string;
  status?: string;
  page?: number;
  limit?: number;
  unassigned?: boolean;
}) => {
  const { patientId, therapistId, date, status, page = 1, limit = 50, unassigned } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (patientId) where.patientId = patientId;
  if (therapistId) where.therapistId = therapistId;
  if (unassigned) where.therapistId = null;
  if (date) {
    const [year, month, day] = date.split('-').map(Number);
    where.appointmentDate = {
      gte: new Date(year, month - 1, day, 0, 0, 0, 0),
      lte: new Date(year, month - 1, day, 23, 59, 59, 999),
    };
  }
  if (status) where.status = status;

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { appointmentDate: 'asc' },
      include: THERAPIST_INCLUDE,
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAppointmentById = async (id: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: THERAPIST_INCLUDE,
  });

  if (!appointment) throw new Error('Cita no encontrada');
  return appointment;
};

export const updateAppointment = async (
  id: string,
  data: UpdateAppointmentData,
  userRole?: string
) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new Error('Cita no encontrada');

  // Protect assigned therapist: only ADMIN can change an already-assigned therapistId
  const tryingToChangeTherapist =
    'therapistId' in data &&
    data.therapistId !== undefined &&
    data.therapistId !== appointment.therapistId;

  if (tryingToChangeTherapist && appointment.therapistId && userRole !== 'ADMIN') {
    throw new Error('Solo un administrador puede cambiar el terapeuta asignado a esta cita');
  }

  const effectiveTherapistId =
    'therapistId' in data ? data.therapistId : appointment.therapistId;

  if (effectiveTherapistId && (data.appointmentDate || data.therapistId)) {
    const appointmentDate = data.appointmentDate
      ? new Date(data.appointmentDate)
      : appointment.appointmentDate;
    const duration = data.duration || appointment.duration;
    await validateTherapistAvailability(effectiveTherapistId, appointmentDate, duration, id);
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: {
      patientId: data.patientId,
      therapistId: data.therapistId,
      appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : undefined,
      duration: data.duration,
      status: data.status,
    },
    include: THERAPIST_INCLUDE,
  });

  return updatedAppointment;
};

export const claimAppointment = async (appointmentId: string, therapistId: string) => {
  // Use a transaction to atomically check and claim
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({ where: { id: appointmentId } });

    if (!appointment) throw new Error('Cita no encontrada');
    if (appointment.therapistId) {
      throw new Error('Esta cita ya tiene un terapeuta asignado');
    }
    if (appointment.status === 'CANCELLED') {
      throw new Error('No se puede tomar una cita cancelada');
    }

    const therapist = await tx.therapist.findUnique({ where: { id: therapistId } });
    if (!therapist) throw new Error('Terapeuta no encontrado');

    // Check for conflicts with other appointments of this therapist
    const duration = appointment.duration;
    const startTime = appointment.appointmentDate;
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const conflict = await tx.appointment.findFirst({
      where: {
        id: { not: appointmentId },
        therapistId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        appointmentDate: { gte: startTime, lt: endTime },
      },
    });

    if (conflict) {
      throw new Error('Ya tienes una cita en ese horario, no puedes tomar esta cita');
    }

    return tx.appointment.update({
      where: { id: appointmentId },
      data: { therapistId },
      include: THERAPIST_INCLUDE,
    });
  });
};

export const deleteAppointment = async (id: string) => {
  await prisma.appointment.delete({ where: { id } });
};

export const confirmAppointment = async (id: string) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) throw new Error('Cita no encontrada');
  if (appointment.status === 'CANCELLED') {
    throw new Error('No se puede confirmar una cita cancelada');
  }

  return prisma.appointment.update({
    where: { id },
    data: { status: 'CONFIRMED' },
    include: THERAPIST_INCLUDE,
  });
};
