import prisma from '../config/database';
import { DashboardKPIs, PatientReport, SessionReport, ClinicalProgressReport, ReportFilters } from '../types/report';

export const getDashboardKPIs = async (): Promise<DashboardKPIs> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Total de pacientes
  const totalPatients = await prisma.patient.count();

  // Pacientes activos (con citas o sesiones en los últimos 30 días)
  const activePatients = await prisma.patient.count({
    where: {
      OR: [
        {
          appointments: {
            some: {
              appointmentDate: {
                gte: monthAgo,
              },
            },
          },
        },
        {
          sessions: {
            some: {
              sessionDate: {
                gte: monthAgo,
              },
            },
          },
        },
      ],
    },
  });

  // Citas
  const totalAppointments = await prisma.appointment.count();
  const todayAppointments = await prisma.appointment.count({
    where: {
      appointmentDate: {
        gte: today,
        lt: tomorrow,
      },
    },
  });
  const weekAppointments = await prisma.appointment.count({
    where: {
      appointmentDate: {
        gte: weekAgo,
      },
    },
  });
  const monthAppointments = await prisma.appointment.count({
    where: {
      appointmentDate: {
        gte: monthAgo,
      },
    },
  });

  // Sesiones
  const totalSessions = await prisma.treatmentSession.count();
  const todaySessions = await prisma.treatmentSession.count({
    where: {
      sessionDate: {
        gte: today,
        lt: tomorrow,
      },
    },
  });
  const weekSessions = await prisma.treatmentSession.count({
    where: {
      sessionDate: {
        gte: weekAgo,
      },
    },
  });
  const monthSessions = await prisma.treatmentSession.count({
    where: {
      sessionDate: {
        gte: monthAgo,
      },
    },
  });

  // Tasa de asistencia
  const completedAppointments = await prisma.appointment.count({
    where: {
      status: 'COMPLETED',
      appointmentDate: {
        gte: monthAgo,
      },
    },
  });
  const totalScheduledInMonth = await prisma.appointment.count({
    where: {
      appointmentDate: {
        gte: monthAgo,
      },
      status: {
        notIn: ['CANCELLED'],
      },
    },
  });
  const attendanceRate = totalScheduledInMonth > 0 
    ? (completedAppointments / totalScheduledInMonth) * 100 
    : 0;

  // Ingresos (de planes de tratamiento)
  const treatmentPlans = await prisma.treatmentPlan.findMany({
    where: {
      status: {
        in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'],
      },
    },
    select: {
      totalCost: true,
      createdAt: true,
      status: true,
    },
  });

  const revenue = {
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  };

  treatmentPlans.forEach((plan) => {
    const cost = plan.totalCost || 0;
    revenue.total += cost;
    
    if (plan.createdAt >= monthAgo) {
      revenue.month += cost;
      if (plan.createdAt >= weekAgo) {
        revenue.week += cost;
        if (plan.createdAt >= today) {
          revenue.today += cost;
        }
      }
    }
  });

  // Citas por estado
  const appointmentsByStatus = {
    scheduled: await prisma.appointment.count({
      where: { status: 'SCHEDULED' },
    }),
    confirmed: await prisma.appointment.count({
      where: { status: 'CONFIRMED' },
    }),
    completed: await prisma.appointment.count({
      where: { status: 'COMPLETED' },
    }),
    cancelled: await prisma.appointment.count({
      where: { status: 'CANCELLED' },
    }),
    noShow: await prisma.appointment.count({
      where: { status: 'NO_SHOW' },
    }),
  };

  return {
    totalPatients,
    activePatients,
    totalAppointments,
    todayAppointments,
    weekAppointments,
    monthAppointments,
    totalSessions,
    todaySessions,
    weekSessions,
    monthSessions,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
    revenue,
    appointmentsByStatus,
  };
};

export const getPatientReport = async (filters?: ReportFilters): Promise<PatientReport[]> => {
  const where: any = {};

  if (filters?.startDate || filters?.endDate) {
    where.appointments = {
      some: {
        appointmentDate: {
          ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
          ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
        },
      },
    };
  }

  const patients = await prisma.patient.findMany({
    where,
    include: {
      appointments: true,
      sessions: true,
      evaluations: true,
      treatmentPlans: true,
    },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return patients.map((patient) => {
    const completedAppointments = patient.appointments.filter(
      (apt) => apt.status === 'COMPLETED'
    ).length;

    const lastAppointment = patient.appointments
      .sort((a, b) => 
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      )[0]?.appointmentDate;

    const lastSession = patient.sessions
      .sort((a, b) => 
        new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
      )[0]?.sessionDate;

    const isActive = lastAppointment 
      ? new Date(lastAppointment) >= thirtyDaysAgo 
      : false;

    return {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      totalAppointments: patient.appointments.length,
      completedAppointments,
      totalSessions: patient.sessions.length,
      totalEvaluations: patient.evaluations.length,
      totalTreatmentPlans: patient.treatmentPlans.length,
      lastAppointment: lastAppointment ? lastAppointment.toISOString() : null,
      lastSession: lastSession ? lastSession.toISOString() : null,
      status: isActive ? 'active' : 'inactive',
    };
  });
};

export const getSessionReport = async (filters?: ReportFilters): Promise<SessionReport[]> => {
  const where: any = {};

  if (filters?.startDate || filters?.endDate) {
    where.sessionDate = {
      ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
      ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
    };
  }

  if (filters?.patientId) {
    where.patientId = filters.patientId;
  }

  if (filters?.therapistId) {
    where.therapistId = filters.therapistId;
  }

  const sessions = await prisma.treatmentSession.findMany({
    where,
    include: {
      patient: {
        select: {
          name: true,
        },
      },
      therapist: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      sessionDate: 'desc',
    },
  });

  return sessions.map((session) => ({
    id: session.id,
    patientName: session.patient.name,
    therapistName: session.therapist.name,
    sessionDate: session.sessionDate.toISOString(),
    duration: session.duration,
    painLevel: session.painLevel,
    status: 'completed' as const,
  }));
};

export const getClinicalProgressReport = async (filters?: ReportFilters): Promise<ClinicalProgressReport[]> => {
  const where: any = {};

  if (filters?.patientId) {
    where.patientId = filters.patientId;
  }

  const patients = await prisma.patient.findMany({
    where,
    include: {
      evaluations: {
        orderBy: {
          evaluationDate: 'asc',
        },
      },
      sessions: true,
      treatmentPlans: true,
    },
  });

  return patients
    .filter((patient) => patient.evaluations.length > 0 || patient.sessions.length > 0)
    .map((patient) => {
      const initialEvaluation = patient.evaluations.find((e) => e.evaluationType === 'INITIAL');
      const finalEvaluation = patient.evaluations.find((e) => e.evaluationType === 'FINAL');

      const totalSessionsPlanned = patient.treatmentPlans.reduce(
        (sum, plan) => sum + plan.sessionsPlanned,
        0
      );
      const totalSessionsCompleted = patient.sessions.length;

      const painReduction = 
        initialEvaluation?.painLevel !== null &&
        initialEvaluation?.painLevel !== undefined &&
        finalEvaluation?.painLevel !== null &&
        finalEvaluation?.painLevel !== undefined
          ? initialEvaluation.painLevel - finalEvaluation.painLevel
          : undefined;

      return {
        patientId: patient.id,
        patientName: patient.name,
        initialEvaluation: initialEvaluation
          ? {
              date: initialEvaluation.evaluationDate.toISOString(),
              painLevel: initialEvaluation.painLevel,
            }
          : undefined,
        finalEvaluation: finalEvaluation
          ? {
              date: finalEvaluation.evaluationDate.toISOString(),
              painLevel: finalEvaluation.painLevel,
            }
          : undefined,
        progress: {
          painReduction,
          sessionsCompleted: totalSessionsCompleted,
          sessionsPlanned: totalSessionsPlanned,
          completionRate:
            totalSessionsPlanned > 0
              ? (totalSessionsCompleted / totalSessionsPlanned) * 100
              : 0,
        },
        treatmentPlans: {
          total: patient.treatmentPlans.length,
          completed: patient.treatmentPlans.filter((p) => p.status === 'COMPLETED').length,
          inProgress: patient.treatmentPlans.filter((p) => p.status === 'IN_PROGRESS').length,
        },
      };
    });
};

