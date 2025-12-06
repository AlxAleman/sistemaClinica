import prisma from '../config/database';
import { CreateTherapistData, UpdateTherapistData, CreateAvailabilityData, UpdateAvailabilityData } from '../types/therapist';

export const createTherapist = async (data: CreateTherapistData) => {
  const therapist = await prisma.therapist.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone,
      specialization: data.specialization || null,
    },
  });

  return therapist;
};

export const getTherapists = async (filters: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const { search, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { specialization: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [therapists, total] = await Promise.all([
    prisma.therapist.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        availability: true,
        _count: {
          select: {
            appointments: true,
            sessions: true,
          },
        },
      },
    }),
    prisma.therapist.count({ where }),
  ]);

  return {
    therapists,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTherapistById = async (id: string) => {
  const therapist = await prisma.therapist.findUnique({
    where: { id },
    include: {
      availability: {
        orderBy: { dayOfWeek: 'asc' },
      },
      appointments: {
        orderBy: { appointmentDate: 'desc' },
        take: 10,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      },
      _count: {
        select: {
          appointments: true,
          sessions: true,
        },
      },
    },
  });

  if (!therapist) {
    throw new Error('Terapeuta no encontrado');
  }

  return therapist;
};

export const updateTherapist = async (id: string, data: UpdateTherapistData) => {
  const therapist = await prisma.therapist.update({
    where: { id },
    data: {
      email: data.email?.toLowerCase(),
      name: data.name,
      phone: data.phone,
      specialization: data.specialization,
    },
  });

  return therapist;
};

export const deleteTherapist = async (id: string) => {
  await prisma.therapist.delete({
    where: { id },
  });
};

// Disponibilidad
export const createAvailability = async (
  therapistId: string,
  data: CreateAvailabilityData
) => {
  // Verificar que el terapeuta existe
  const therapist = await prisma.therapist.findUnique({
    where: { id: therapistId },
  });

  if (!therapist) {
    throw new Error('Terapeuta no encontrado');
  }

  // Verificar que no existe ya una disponibilidad para ese día
  const existing = await prisma.therapistAvailability.findFirst({
    where: {
      therapistId,
      dayOfWeek: data.dayOfWeek,
    },
  });

  if (existing) {
    throw new Error('Ya existe disponibilidad para este día');
  }

  const availability = await prisma.therapistAvailability.create({
    data: {
      therapistId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      isAvailable: data.isAvailable ?? true,
    },
  });

  return availability;
};

export const updateAvailability = async (
  id: string,
  data: UpdateAvailabilityData
) => {
  const availability = await prisma.therapistAvailability.update({
    where: { id },
    data: {
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      isAvailable: data.isAvailable,
    },
  });

  return availability;
};

export const deleteAvailability = async (id: string) => {
  await prisma.therapistAvailability.delete({
    where: { id },
  });
};

export const getTherapistAvailability = async (therapistId: string) => {
  const availability = await prisma.therapistAvailability.findMany({
    where: {
      therapistId,
      isAvailable: true,
    },
    orderBy: { dayOfWeek: 'asc' },
  });

  return availability;
};

