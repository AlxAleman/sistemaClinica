import prisma from '../config/database';

export const getExpediente = async (patientId: string) => {
  // Verificar que el paciente existe
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado');
  }

  // Obtener todos los datos en paralelo para mejor rendimiento
  const [
    medicalProfile,
    diagnoses,
    therapistNotes,
    sessions,
    payments,
    documents,
  ] = await Promise.all([
    // Perfil médico completo
    prisma.medicalProfile.findUnique({
      where: { patientId },
    }),

    // Diagnósticos con sus planes de tratamiento
    prisma.diagnosis.findMany({
      where: { patientId },
      orderBy: { diagnosisDate: 'desc' },
      include: {
        treatmentPlans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    }),

    // Notas del terapista ordenadas por fecha descendente
    prisma.therapistNote.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        therapist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    // Últimas 20 sesiones con terapeuta y estado de asistencia
    prisma.treatmentSession.findMany({
      where: { patientId },
      orderBy: { sessionDate: 'desc' },
      take: 20,
      include: {
        therapist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    // Todos los pagos ordenados por fecha descendente
    prisma.payment.findMany({
      where: { patientId },
      orderBy: { paymentDate: 'desc' },
    }),

    // Todos los documentos
    prisma.medicalDocument.findMany({
      where: { patientId },
      orderBy: { uploadedAt: 'desc' },
    }),
  ]);

  // Calcular sessionsRemaining para cada plan de tratamiento dentro de cada diagnóstico
  const diagnosesWithComputed = diagnoses.map((diagnosis) => ({
    ...diagnosis,
    treatmentPlans: diagnosis.treatmentPlans.map((plan) => ({
      ...plan,
      sessionsRemaining: plan.sessionsPlanned - plan.sessionsCompleted,
    })),
  }));

  // Estadísticas resumidas
  const totalSessions = await prisma.treatmentSession.count({
    where: { patientId },
  });

  const attendedSessions = await prisma.treatmentSession.count({
    where: { patientId, attendanceStatus: 'ATTENDED' },
  });

  const pendingSessions = await prisma.treatmentSession.count({
    where: { patientId, attendanceStatus: 'PENDING' },
  });

  const activeTreatmentPlans = await prisma.treatmentPlan.count({
    where: { patientId, status: 'ACTIVE' },
  });

  const totalPaidResult = await prisma.payment.aggregate({
    where: { patientId, status: 'COMPLETED' },
    _sum: { amount: true },
  });

  const totalPaid = totalPaidResult._sum.amount ?? 0;

  return {
    patient,
    medicalProfile,
    diagnoses: diagnosesWithComputed,
    therapistNotes,
    sessions,
    payments,
    documents,
    summary: {
      totalSessions,
      attendedSessions,
      pendingSessions,
      totalPaid,
      activeTreatmentPlans,
    },
  };
};
