import prisma from '../config/database';
import { CreateDiagnosisData, UpdateDiagnosisData } from '../types/diagnosis';

export const createDiagnosis = async (data: CreateDiagnosisData) => {
  // Verificar que el paciente existe
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  // Obtener o crear el perfil médico del paciente
  let medicalProfile = await prisma.medicalProfile.findUnique({
    where: { patientId: data.patientId },
  });

  if (!medicalProfile) {
    medicalProfile = await prisma.medicalProfile.create({
      data: {
        patientId: data.patientId,
      },
    });
  }

  const diagnosis = await prisma.diagnosis.create({
    data: {
      patientId: data.patientId,
      medicalProfileId: medicalProfile.id,
      clinicalDiagnosis: data.clinicalDiagnosis,
      diagnosisDate: data.diagnosisDate ? new Date(data.diagnosisDate) : undefined,
      observations: data.observations || null,
      status: data.status || 'ACTIVE',
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
      medicalProfile: true,
    },
  });

  return diagnosis;
};

export const getDiagnosesByPatient = async (patientId: string) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  const diagnoses = await prisma.diagnosis.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { treatmentPlans: true },
      },
      evaluacionFisica: {
        select: {
          id: true,
          tipo: true,
          fechaEvaluacion: true,
        },
      },
    },
  });

  return diagnoses;
};

export const getDiagnosisById = async (id: string) => {
  const diagnosis = await prisma.diagnosis.findUnique({
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
      treatmentPlans: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!diagnosis) {
    throw new Error('Diagnóstico no encontrado');
  }

  return diagnosis;
};

export const updateDiagnosis = async (id: string, data: UpdateDiagnosisData) => {
  const existing = await prisma.diagnosis.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Diagnóstico no encontrado');
  }

  const diagnosis = await prisma.diagnosis.update({
    where: { id },
    data: {
      clinicalDiagnosis: data.clinicalDiagnosis,
      diagnosisDate: data.diagnosisDate ? new Date(data.diagnosisDate) : undefined,
      observations: data.observations,
      status: data.status,
      evaluacionFisicaId: data.evaluacionFisicaId !== undefined ? data.evaluacionFisicaId : undefined,
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
      treatmentPlans: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return diagnosis;
};

export const deleteDiagnosis = async (id: string) => {
  const existing = await prisma.diagnosis.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Diagnóstico no encontrado');
  }

  await prisma.diagnosis.delete({
    where: { id },
  });
};
