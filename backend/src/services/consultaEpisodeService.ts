import prisma from '../config/database';

export const createEpisode = async (data: {
  patientId: string;
  motivoConsulta: string;
  fecha?: string;
  notas?: string;
}) => {
  return prisma.consultaEpisode.create({
    data: {
      patientId: data.patientId,
      motivoConsulta: data.motivoConsulta,
      fecha: data.fecha ? new Date(data.fecha) : undefined,
      notas: data.notas ?? null,
    },
    include: episodeIncludes,
  });
};

export const getEpisodesByPatient = async (patientId: string) => {
  return prisma.consultaEpisode.findMany({
    where: { patientId },
    orderBy: { fecha: 'desc' },
    include: episodeIncludes,
  });
};

export const getEpisodeById = async (id: string) => {
  return prisma.consultaEpisode.findUnique({
    where: { id },
    include: episodeIncludes,
  });
};

export const updateEpisode = async (
  id: string,
  data: { motivoConsulta?: string; fecha?: string; notas?: string; isActive?: boolean }
) => {
  return prisma.consultaEpisode.update({
    where: { id },
    data: {
      motivoConsulta: data.motivoConsulta,
      fecha: data.fecha ? new Date(data.fecha) : undefined,
      notas: data.notas,
      isActive: data.isActive,
    },
    include: episodeIncludes,
  });
};

export const deleteEpisode = async (id: string) => {
  return prisma.consultaEpisode.delete({ where: { id } });
};

const episodeIncludes = {
  evaluaciones: {
    select: { id: true, tipo: true, fechaEvaluacion: true, escalaDolor: true },
    orderBy: { fechaEvaluacion: 'desc' as const },
  },
  diagnoses: {
    select: {
      id: true,
      clinicalDiagnosis: true,
      diagnosisDate: true,
      status: true,
      observations: true,
      _count: { select: { treatmentPlans: true } },
    },
    orderBy: { diagnosisDate: 'desc' as const },
  },
  treatmentPlans: {
    select: {
      id: true,
      title: true,
      status: true,
      sessionsPlanned: true,
      sessionsCompleted: true,
      startDate: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
};
