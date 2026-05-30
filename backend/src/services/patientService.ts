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
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}) => {
  const { search, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.gender) {
    where.gender = filters.gender;
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

  const orderBy: any = sortBy === 'name'
    ? { name: sortOrder }
    : { createdAt: sortOrder };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        medicalProfile: true,
        _count: {
          select: {
            appointments: true,
            sessions: true,
            evaluations: true,
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
  const set = <T>(val: T | null | undefined): T | null | undefined =>
    val === undefined ? undefined : (val as T | null);

  const patient = await prisma.patient.update({
    where: { id },
    data: {
      ...(data.email !== undefined && {
        email: data.email ? data.email.toLowerCase() : null,
      }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      dui:              set(data.dui),
      gender:           set(data.gender),
      photoUrl:         set(data.photoUrl),
      birthDate:        data.birthDate !== undefined
        ? (data.birthDate ? new Date(data.birthDate) : null)
        : undefined,
      address:          set(data.address),
      residence:        set(data.residence),
      profession:       set(data.profession),
      workplace:        set(data.workplace),
      insuranceCompany: set(data.insuranceCompany),
      affiliateNumber:  set(data.affiliateNumber),
      emergencyContact: set(data.emergencyContact),
      emergencyPhone:   set(data.emergencyPhone),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return patient;
};

export const deletePatient = async (id: string) => {
  // Borrar todos los archivos del paciente en R2 antes de eliminar de la BD
  const documents = await prisma.medicalDocument.findMany({
    where: { patientId: id },
    select: { fileUrl: true },
  });

  if (documents.length > 0) {
    const { deleteFromR2 } = await import('./r2Service');
    await Promise.allSettled(documents.map(doc => deleteFromR2(doc.fileUrl)));
  }

  await prisma.patient.delete({ where: { id } });
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

export const deleteMedicalDocument = async (patientId: string, documentId: string) => {
  const doc = await prisma.medicalDocument.findFirst({
    where: { id: documentId, patientId },
  });

  if (!doc) {
    throw new Error('Documento no encontrado');
  }

  // Eliminar el archivo de R2 primero
  const { deleteFromR2 } = await import('./r2Service');
  await deleteFromR2(doc.fileUrl);

  await prisma.medicalDocument.delete({ where: { id: documentId } });
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

