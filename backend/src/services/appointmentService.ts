import prisma from '../config/database';
import { CreateAppointmentData, UpdateAppointmentData } from '../types/appointment';

export const createAppointment = async (data: CreateAppointmentData) => {
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

  // Validar disponibilidad del terapeuta
  const appointmentDate = new Date(data.appointmentDate);
  const dayOfWeek = appointmentDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const appointmentTime = appointmentDate.toTimeString().slice(0, 5); // HH:mm

  // Obtener disponibilidad del terapeuta para ese día
  const availability = await prisma.therapistAvailability.findFirst({
    where: {
      therapistId: data.therapistId,
      dayOfWeek,
      isAvailable: true,
    },
  });

  if (!availability) {
    throw new Error('El terapeuta no está disponible en este día');
  }

  // Verificar que la hora de la cita está dentro del rango de disponibilidad
  if (appointmentTime < availability.startTime || appointmentTime >= availability.endTime) {
    throw new Error(`El terapeuta solo está disponible de ${availability.startTime} a ${availability.endTime}`);
  }

  // Verificar que no hay conflictos con otras citas
  const duration = data.duration || 60;
  const endTime = new Date(appointmentDate.getTime() + duration * 60000);

  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      therapistId: data.therapistId,
      status: {
        notIn: ['CANCELLED', 'NO_SHOW'],
      },
      appointmentDate: {
        gte: appointmentDate,
        lt: endTime,
      },
    },
  });

  if (conflictingAppointment) {
    throw new Error('El terapeuta ya tiene una cita en este horario');
  }

  // Verificar también citas que terminan después de que comience esta
  const conflictingAppointment2 = await prisma.appointment.findFirst({
    where: {
      therapistId: data.therapistId,
      status: {
        notIn: ['CANCELLED', 'NO_SHOW'],
      },
      AND: [
        {
          appointmentDate: {
            lt: appointmentDate,
          },
        },
        {
          appointmentDate: {
            gte: new Date(appointmentDate.getTime() - duration * 60000),
          },
        },
      ],
    },
  });

  if (conflictingAppointment2) {
    // Calcular la hora de finalización de la cita conflictiva
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: conflictingAppointment2.id },
    });

    if (existingAppointment) {
      const existingEndTime = new Date(
        existingAppointment.appointmentDate.getTime() + existingAppointment.duration * 60000
      );

      if (existingEndTime > appointmentDate) {
        throw new Error('El terapeuta ya tiene una cita que se superpone con este horario');
      }
    }
  }

  // Crear la cita
  const appointment = await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      therapistId: data.therapistId,
      appointmentDate,
      duration,
      status: 'SCHEDULED',
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

  return appointment;
};

export const getAppointments = async (filters: {
  patientId?: string;
  therapistId?: string;
  date?: string; // YYYY-MM-DD
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { patientId, therapistId, date, status, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (patientId) {
    where.patientId = patientId;
  }

  if (therapistId) {
    where.therapistId = therapistId;
  }

  if (date) {
    // Parsear la fecha en formato YYYY-MM-DD y crear fechas en zona horaria local
    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    where.appointmentDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  if (status) {
    where.status = status;
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { appointmentDate: 'asc' },
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
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAppointmentById = async (id: string) => {
  const appointment = await prisma.appointment.findUnique({
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

  if (!appointment) {
    throw new Error('Cita no encontrada');
  }

  return appointment;
};

export const updateAppointment = async (id: string, data: UpdateAppointmentData) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    throw new Error('Cita no encontrada');
  }

  // Si se está cambiando la fecha o el terapeuta, validar disponibilidad
  if (data.appointmentDate || data.therapistId) {
    const appointmentDate = data.appointmentDate ? new Date(data.appointmentDate) : appointment.appointmentDate;
    const therapistId = data.therapistId || appointment.therapistId;
    const duration = data.duration || appointment.duration;

    // Validar disponibilidad (similar a createAppointment)
    const dayOfWeek = appointmentDate.getDay();
    const appointmentTime = appointmentDate.toTimeString().slice(0, 5);

    const availability = await prisma.therapistAvailability.findFirst({
      where: {
        therapistId,
        dayOfWeek,
        isAvailable: true,
      },
    });

    if (!availability) {
      throw new Error('El terapeuta no está disponible en este día');
    }

    if (appointmentTime < availability.startTime || appointmentTime >= availability.endTime) {
      throw new Error(`El terapeuta solo está disponible de ${availability.startTime} a ${availability.endTime}`);
    }

    // Verificar conflictos (excluyendo la cita actual)
    const endTime = new Date(appointmentDate.getTime() + duration * 60000);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        therapistId,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
        appointmentDate: {
          gte: appointmentDate,
          lt: endTime,
        },
      },
    });

    if (conflictingAppointment) {
      throw new Error('El terapeuta ya tiene una cita en este horario');
    }
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

  return updatedAppointment;
};

export const deleteAppointment = async (id: string) => {
  await prisma.appointment.delete({
    where: { id },
  });
};

export const confirmAppointment = async (id: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    throw new Error('Cita no encontrada');
  }

  if (appointment.status === 'CANCELLED') {
    throw new Error('No se puede confirmar una cita cancelada');
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
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

  return updatedAppointment;
};

