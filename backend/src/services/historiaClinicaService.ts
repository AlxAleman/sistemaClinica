import prisma from '../config/database';

export interface AntecedentItem {
  tiene: boolean;
  especifique: string;
}

export interface HistoriaClinicaInput {
  patientId: string;
  // Exploración física
  peso?: number;
  talla?: number;
  imc?: number;
  etnia?: string;
  // Consulta
  motivoConsulta?: string;
  tratamientosPrevios?: string;
  // JSON sections
  antecedentes?: Record<string, AntecedentItem>;
  signosVitales?: Record<string, string>;
  espasmos?: Record<string, unknown>;
  habitosSalud?: Record<string, AntecedentItem>;
  datosGinecologicos?: Record<string, unknown>;
  diagnosticoRehabilitacion?: Record<string, string>;
  cicatrizQuirurgica?: string;
  traslados?: Record<string, unknown>;
  marchaDeambulacion?: Record<string, unknown>;
  escalaDolor?: number;
  fuerzaMuscular?: Record<string, unknown>;
  goniometriaSuper?: Record<string, unknown>;
  goniometriaInfer?: Record<string, unknown>;
  valoracionPostural?: Record<string, unknown>;
  columna?: Record<string, unknown>;
  fechaEvaluacion?: Date;
  creadoPor?: string;
}

export const getById = async (id: string) => {
  const historia = await prisma.historiaClinica.findUnique({
    where: { id },
    include: {
      patient: {
        select: { id: true, name: true, gender: true, birthDate: true, photoUrl: true, phone: true },
      },
    },
  });
  if (!historia) throw new Error('Expediente no encontrado');
  return historia;
};

export const getByPatientId = async (patientId: string) => {
  const historia = await prisma.historiaClinica.findUnique({
    where: { patientId },
    include: {
      patient: {
        select: { id: true, name: true, gender: true, birthDate: true, photoUrl: true },
      },
    },
  });
  return historia;
};

export const getAll = async (search?: string) => {
  const historias = await prisma.historiaClinica.findMany({
    include: {
      patient: {
        select: { id: true, name: true, gender: true, birthDate: true, photoUrl: true, phone: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    where: search
      ? {
          patient: {
            name: { contains: search, mode: 'insensitive' },
          },
        }
      : undefined,
  });
  return historias;
};

export const create = async (data: HistoriaClinicaInput) => {
  const { patientId, ...rest } = data;

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new Error('Paciente no encontrado');

  const existing = await prisma.historiaClinica.findUnique({ where: { patientId } });
  if (existing) throw new Error('Este paciente ya tiene una historia clínica registrada');

  const historia = await prisma.historiaClinica.create({
    data: {
      patientId,
      ...(rest as any),
    },
    include: {
      patient: {
        select: { id: true, name: true, gender: true, birthDate: true, photoUrl: true },
      },
    },
  });

  return historia;
};

export const update = async (id: string, data: Partial<HistoriaClinicaInput>) => {
  const { patientId, ...rest } = data;

  const historia = await prisma.historiaClinica.update({
    where: { id },
    data: rest as any,
    include: {
      patient: {
        select: { id: true, name: true, gender: true, birthDate: true, photoUrl: true },
      },
    },
  });

  return historia;
};

export const remove = async (id: string) => {
  await prisma.historiaClinica.delete({ where: { id } });
};
