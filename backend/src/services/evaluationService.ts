import prisma from '../config/database';
import { CreateEvaluationData, UpdateEvaluationData, EvaluationComparison } from '../types/evaluation';

export const createEvaluation = async (data: CreateEvaluationData) => {
  // Verificar que el paciente existe
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  // Crear la evaluación
  const evaluation = await prisma.evaluation.create({
    data: {
      patientId: data.patientId,
      evaluationType: data.evaluationType,
      evaluationDate: new Date(data.evaluationDate),
      rangeOfMotion: data.rangeOfMotion || null,
      strength: data.strength || null,
      painLevel: data.painLevel || null,
      functionalAssessment: data.functionalAssessment || null,
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
    },
  });

  return evaluation;
};

export const getEvaluations = async (filters: {
  patientId?: string;
  evaluationType?: string;
  page?: number;
  limit?: number;
}) => {
  const { patientId, evaluationType, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (patientId) {
    where.patientId = patientId;
  }

  if (evaluationType) {
    where.evaluationType = evaluationType;
  }

  const [evaluations, total] = await Promise.all([
    prisma.evaluation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { evaluationDate: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    prisma.evaluation.count({ where }),
  ]);

  return {
    evaluations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEvaluationById = async (id: string) => {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!evaluation) {
    throw new Error('Evaluación no encontrada');
  }

  return evaluation;
};

export const updateEvaluation = async (id: string, data: UpdateEvaluationData) => {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
  });

  if (!evaluation) {
    throw new Error('Evaluación no encontrada');
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

  const updatedEvaluation = await prisma.evaluation.update({
    where: { id },
    data: {
      patientId: data.patientId,
      evaluationType: data.evaluationType,
      evaluationDate: data.evaluationDate ? new Date(data.evaluationDate) : undefined,
      rangeOfMotion: data.rangeOfMotion,
      strength: data.strength,
      painLevel: data.painLevel,
      functionalAssessment: data.functionalAssessment,
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
    },
  });

  return updatedEvaluation;
};

export const deleteEvaluation = async (id: string) => {
  await prisma.evaluation.delete({
    where: { id },
  });
};

export const getEvaluationComparison = async (patientId: string): Promise<EvaluationComparison> => {
  // Obtener todas las evaluaciones del paciente
  const evaluations = await prisma.evaluation.findMany({
    where: { patientId },
    orderBy: { evaluationDate: 'asc' },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const initial = evaluations.find((e) => e.evaluationType === 'INITIAL');
  const final = evaluations.find((e) => e.evaluationType === 'FINAL');
  const progress = evaluations.filter((e) => e.evaluationType === 'PROGRESS');

  // Calcular mejoras
  const improvements: EvaluationComparison['improvements'] = {};

  if (initial && final) {
    // Mejora en nivel de dolor (diferencia negativa es mejor)
    if (initial.painLevel !== null && final.painLevel !== null) {
      improvements.painLevel = initial.painLevel - final.painLevel;
    }

    // Comparar otros campos si existen
    if (initial.rangeOfMotion && final.rangeOfMotion) {
      improvements.rangeOfMotion = `Inicial: ${initial.rangeOfMotion} → Final: ${final.rangeOfMotion}`;
    }

    if (initial.strength && final.strength) {
      improvements.strength = `Inicial: ${initial.strength} → Final: ${final.strength}`;
    }

    if (initial.functionalAssessment && final.functionalAssessment) {
      improvements.functionalAssessment = `Inicial: ${initial.functionalAssessment} → Final: ${final.functionalAssessment}`;
    }
  }

  return {
    initial: initial || undefined,
    final: final || undefined,
    progress,
    improvements,
  };
};

