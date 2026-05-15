import prisma from '../config/database';

export interface EvaluacionFisicaInput {
  historiaClinicaId: string;
  patientId: string;
  tipo?: string;
  fechaEvaluacion?: Date;
  peso?: number;
  talla?: number;
  imc?: number;
  signosVitales?: Record<string, string>;
  espasmos?: Record<string, unknown>;
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
  episodeId?: string | null;
  creadoPor?: string;
}

export const getByHistoria = async (historiaClinicaId: string) => {
  return prisma.evaluacionFisica.findMany({
    where: { historiaClinicaId },
    orderBy: { fechaEvaluacion: 'desc' },
  });
};

export const getByPatient = async (patientId: string) => {
  return prisma.evaluacionFisica.findMany({
    where: { patientId },
    orderBy: { fechaEvaluacion: 'desc' },
  });
};

export const getById = async (id: string) => {
  const evaluacion = await prisma.evaluacionFisica.findUnique({ where: { id } });
  if (!evaluacion) throw new Error('Evaluación física no encontrada');
  return evaluacion;
};

export const create = async (data: EvaluacionFisicaInput) => {
  const historia = await prisma.historiaClinica.findUnique({
    where: { id: data.historiaClinicaId },
  });
  if (!historia) throw new Error('Expediente no encontrado');

  return prisma.evaluacionFisica.create({
    data: data as any,
  });
};

export const update = async (id: string, data: Partial<EvaluacionFisicaInput>) => {
  const { historiaClinicaId, patientId, ...rest } = data;
  return prisma.evaluacionFisica.update({
    where: { id },
    data: rest as any,
  });
};

export const remove = async (id: string) => {
  await prisma.evaluacionFisica.delete({ where: { id } });
};
