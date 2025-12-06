import prisma from '../config/database';
import { CreatePrescriptionData, UpdatePrescriptionData, Prescription, Medication } from '../types/prescription';

export const createPrescription = async (data: CreatePrescriptionData) => {
  // Verificar que el paciente existe
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  // Si hay therapistId, verificar que existe
  if (data.therapistId) {
    const therapist = await prisma.therapist.findUnique({
      where: { id: data.therapistId },
    });

    if (!therapist) {
      throw new Error('Terapeuta no encontrado');
    }
  }

  // Convertir prescriptionDate a formato ISO si viene en formato datetime-local
  let prescriptionDate = new Date();
  if (data.prescriptionDate) {
    // Si viene en formato datetime-local (YYYY-MM-DDTHH:mm), agregar segundos
    const dateStr = data.prescriptionDate.includes(':') && !data.prescriptionDate.includes('Z') && !data.prescriptionDate.includes('+')
      ? data.prescriptionDate + ':00'
      : data.prescriptionDate;
    prescriptionDate = new Date(dateStr);
    if (isNaN(prescriptionDate.getTime())) {
      throw new Error('Fecha de receta inválida');
    }
  }

  // Crear la receta
  const prescription = await prisma.prescription.create({
    data: {
      patientId: data.patientId,
      therapistId: data.therapistId || null,
      prescriptionDate: prescriptionDate,
      diagnosis: data.diagnosis || null,
      medications: JSON.stringify(data.medications),
      instructions: data.instructions || null,
      notes: data.notes || null,
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
      therapist: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
    },
  });

  return {
    ...prescription,
    medications: JSON.parse(prescription.medications) as Medication[],
  };
};

export const getPrescriptions = async (filters: {
  patientId?: string;
  therapistId?: string;
  page?: number;
  limit?: number;
}) => {
  const { patientId, therapistId, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (patientId) {
    where.patientId = patientId;
  }

  if (therapistId) {
    where.therapistId = therapistId;
  }

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { prescriptionDate: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
    prisma.prescription.count({ where }),
  ]);

  return {
    prescriptions: prescriptions.map((p) => ({
      ...p,
      medications: JSON.parse(p.medications) as Medication[],
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPrescriptionById = async (id: string) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          dui: true,
          birthDate: true,
          address: true,
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

  if (!prescription) {
    throw new Error('Receta no encontrada');
  }

  return {
    ...prescription,
    medications: JSON.parse(prescription.medications) as Medication[],
  };
};

export const updatePrescription = async (id: string, data: UpdatePrescriptionData) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id },
  });

  if (!prescription) {
    throw new Error('Receta no encontrada');
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

  // Si se actualiza el terapeuta, verificar que existe
  if (data.therapistId) {
    const therapist = await prisma.therapist.findUnique({
      where: { id: data.therapistId },
    });

    if (!therapist) {
      throw new Error('Terapeuta no encontrado');
    }
  }

  // Convertir prescriptionDate a formato ISO si viene en formato datetime-local
  let prescriptionDate: Date | undefined = undefined;
  if (data.prescriptionDate) {
    const dateStr = data.prescriptionDate.includes(':') && !data.prescriptionDate.includes('Z') && !data.prescriptionDate.includes('+')
      ? data.prescriptionDate + ':00'
      : data.prescriptionDate;
    prescriptionDate = new Date(dateStr);
    if (isNaN(prescriptionDate.getTime())) {
      throw new Error('Fecha de receta inválida');
    }
  }

  const updatedPrescription = await prisma.prescription.update({
    where: { id },
    data: {
      patientId: data.patientId,
      therapistId: data.therapistId !== undefined ? data.therapistId : undefined,
      prescriptionDate: prescriptionDate,
      diagnosis: data.diagnosis,
      medications: data.medications ? JSON.stringify(data.medications) : undefined,
      instructions: data.instructions,
      notes: data.notes,
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
      therapist: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
    },
  });

  return {
    ...updatedPrescription,
    medications: JSON.parse(updatedPrescription.medications) as Medication[],
  };
};

export const deletePrescription = async (id: string) => {
  await prisma.prescription.delete({
    where: { id },
  });
};

export const markAsPrinted = async (id: string) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id },
  });

  if (!prescription) {
    throw new Error('Receta no encontrada');
  }

  const updatedPrescription = await prisma.prescription.update({
    where: { id },
    data: {
      printed: true,
      printedAt: new Date(),
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
      therapist: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
    },
  });

  return {
    ...updatedPrescription,
    medications: JSON.parse(updatedPrescription.medications) as Medication[],
  };
};

