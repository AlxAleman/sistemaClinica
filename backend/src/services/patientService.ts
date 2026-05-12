import prisma from '../config/database';
import { CreatePatientData, UpdatePatientData } from '../types/patient';

export const createPatient = async (data: CreatePatientData) => {
  const patient = await prisma.patient.create({
    data: {
      email: data.email?.toLowerCase() || null,
      name: data.name,
      phone: data.phone,
      dui: data.dui || null,
      gender: data.gender || null,
      photoUrl: data.photoUrl || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      address: data.address || null,
      residence: data.residence || null,
      profession: data.profession || null,
      workplace: data.workplace || null,
      insuranceCompany: data.insuranceCompany || null,
      affiliateNumber: data.affiliateNumber || null,
      emergencyContact: data.emergencyContact || null,
      emergencyPhone: data.emergencyPhone || null,
      isActive: data.isActive ?? true,
    },
  });

  // Crear expediente clínico automáticamente
  await prisma.medicalProfile.create({
    data: { patientId: patient.id },
  });

  return patient;
};

export const getPatients = async (filters: {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) => {
  const { search, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { dui: { contains: search } },
      { profession: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        medicalProfile: true,
        _count: {
          select: {
            appointments: true,
            sessions: true,
          },
        },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    patients,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPatientById = async (id: string) => {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      medicalProfile: true,
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
      appointments: {
        orderBy: { appointmentDate: 'desc' },
        take: 10,
        include: {
          therapist: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      sessions: {
        orderBy: { sessionDate: 'desc' },
        take: 10,
        include: {
          therapist: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      evaluations: {
        orderBy: { evaluationDate: 'desc' },
        take: 5,
      },
      treatmentPlans: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: {
        select: {
          appointments: true,
          sessions: true,
          evaluations: true,
        },
      },
    },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  return patient;
};

export const updatePatient = async (id: string, data: UpdatePatientData) => {
  const patient = await prisma.patient.update({
    where: { id },
    data: {
      email: data.email?.toLowerCase() || undefined,
      name: data.name,
      phone: data.phone,
      dui: data.dui || undefined,
      gender: data.gender || undefined,
      photoUrl: data.photoUrl || undefined,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      address: data.address || undefined,
      residence: data.residence || undefined,
      profession: data.profession || undefined,
      workplace: data.workplace || undefined,
      insuranceCompany: data.insuranceCompany || undefined,
      affiliateNumber: data.affiliateNumber || undefined,
      emergencyContact: data.emergencyContact || undefined,
      emergencyPhone: data.emergencyPhone || undefined,
      isActive: data.isActive,
    },
  });

  return patient;
};

export const deletePatient = async (id: string) => {
  await prisma.patient.delete({
    where: { id },
  });
};

export const createMedicalProfile = async (
  patientId: string,
  data: {
    allergies?: string;
    medicalHistory?: string;
    currentMedications?: string;
    notes?: string;
  }
) => {
  const profile = await prisma.medicalProfile.upsert({
    where: { patientId },
    update: {
      allergies: data.allergies || undefined,
      medicalHistory: data.medicalHistory || undefined,
      currentMedications: data.currentMedications || undefined,
      notes: data.notes || undefined,
    },
    create: {
      patientId,
      allergies: data.allergies || null,
      medicalHistory: data.medicalHistory || null,
      currentMedications: data.currentMedications || null,
      notes: data.notes || null,
    },
  });

  return profile;
};

export const createMedicalDocument = async (
  patientId: string,
  data: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    description?: string | null;
    category?: string;
  }
) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  const document = await prisma.medicalDocument.create({
    data: {
      patientId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      description: data.description || null,
      category: data.category || 'otro',
    },
  });

  return document;
};

