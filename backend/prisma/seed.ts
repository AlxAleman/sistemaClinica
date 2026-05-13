import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Hoy es la fecha base para todos los datos
const TODAY = new Date('2026-05-09T00:00:00.000Z');
const d = (offsetDays: number, hour: number, minute = 0) => {
  const dt = new Date(TODAY);
  dt.setUTCDate(dt.getUTCDate() + offsetDays);
  dt.setUTCHours(hour, minute, 0, 0);
  return dt;
};

async function main() {
  console.log('🌱 Iniciando seed de datos...\n');

  // ─────────────────────────────────────────────
  // SISTEMA: Configuración inicial
  // ─────────────────────────────────────────────
  console.log('⚙️  Inicializando configuración del sistema...');
  const configs = [
    { key: 'therapy_types', value: JSON.stringify(['Fisioterapia General', 'Rehabilitación Lumbar', 'Rehabilitación de Hombro', 'Rehabilitación de Rodilla', 'Rehabilitación de Cadera/Pelvis', 'Terapia Deportiva', 'Electroterapia', 'Ultrasonido Terapéutico', 'Masoterapia', 'Hidroterapia', 'Movilización Manual', 'Estiramiento y Flexibilidad', 'Fortalecimiento Muscular', 'Drenaje Linfático', 'Vendaje Neuromuscular (Kinesiotape)', 'Ejercicio Terapéutico', 'Reentrenamiento de Marcha', 'Equilibrio y Coordinación', 'Neurorehabilitación', 'Liberación Miofascial', 'RPG (Reeducación Postural Global)', 'Pilates Terapéutico', 'Rehabilitación Post-Operatoria', 'Rehabilitación Pediátrica', 'Fisioterapia Oncológica', 'Terapia Vestibular (Vértigo/Mareos)', 'Punción Seca']), description: 'Tipos de terapia disponibles', category: 'therapy_types' },
    { key: 'session_durations', value: JSON.stringify([30, 45, 60, 90]), description: 'Duraciones de sesión en minutos', category: 'session_durations' },
    { key: 'clinic_hours_start', value: '07:00', description: 'Hora de apertura de la clínica', category: 'schedules' },
    { key: 'clinic_hours_end', value: '19:00', description: 'Hora de cierre de la clínica', category: 'schedules' },
    { key: 'currency', value: 'USD', description: 'Moneda del sistema', category: 'general' },
    { key: 'session_price_default', value: '50.00', description: 'Precio por sesión por defecto', category: 'general' },
    { key: 'payment_methods', value: JSON.stringify(['CASH', 'POS', 'TRANSFER']), description: 'Métodos de pago habilitados', category: 'payment_methods' },
    { key: 'alert_no_show_threshold', value: '3', description: 'Cantidad de no-shows para generar alerta', category: 'alerts' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log('   ✅ Configuración lista\n');

  // ─────────────────────────────────────────────
  // USUARIO ADMIN
  // ─────────────────────────────────────────────
  console.log('👤 Creando usuario administrador...');
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@clinica.com' },
    update: { password: adminPassword, name: 'Administrador', role: 'ADMIN' },
    create: { email: 'admin@clinica.com', password: adminPassword, name: 'Administrador', role: 'ADMIN' },
  });
  console.log('   ✅ admin@clinica.com / Admin123!\n');

  // ─────────────────────────────────────────────
  // TERAPISTAS
  // ─────────────────────────────────────────────
  console.log('👨‍⚕️ Creando terapistas...');
  const therapistsData = [
    { email: 'carlos.mendez@clinica.com', name: 'Dr. Carlos Méndez', phone: '7890-1001', specialization: 'Fisioterapia Deportiva' },
    { email: 'ana.martinez@clinica.com', name: 'Dra. Ana Martínez', phone: '7890-1002', specialization: 'Fisioterapia Neurológica' },
    { email: 'roberto.silva@clinica.com', name: 'Lic. Roberto Silva', phone: '7890-1003', specialization: 'Fisioterapia Ortopédica' },
  ];

  const therapists: any[] = [];
  for (const td of therapistsData) {
    const t = await prisma.therapist.upsert({
      where: { email: td.email },
      update: {},
      create: {
        ...td,
        availability: {
          create: [
            { dayOfWeek: 1, startTime: '07:00', endTime: '19:00' },
            { dayOfWeek: 2, startTime: '07:00', endTime: '19:00' },
            { dayOfWeek: 3, startTime: '07:00', endTime: '19:00' },
            { dayOfWeek: 4, startTime: '07:00', endTime: '19:00' },
            { dayOfWeek: 5, startTime: '07:00', endTime: '17:00' },
          ],
        },
      },
    });
    therapists.push(t);
    console.log(`   ✅ ${t.name}`);
  }
  const [t1, t2, t3] = therapists;
  console.log();

  // ─────────────────────────────────────────────
  // PACIENTES + EXPEDIENTE
  // ─────────────────────────────────────────────
  console.log('🧑‍🤝‍🧑 Creando pacientes con expedientes...');
  const patientsData = [
    {
      name: 'María González', email: 'maria.gonzalez@email.com', phone: '7701-0001', dui: '01234567-8',
      gender: 'FEMALE' as const, birthDate: new Date('1985-05-15'),
      address: 'Col. Escalón, San Salvador', residence: 'San Salvador',
      profession: 'Docente', workplace: 'Colegio Santa Ana',
      insuranceCompany: 'SISA', affiliateNumber: 'SISA-00123',
      emergencyContact: 'Carlos González', emergencyPhone: '7701-9001',
      medical: {
        allergies: 'Penicilina, Polen',
        medicalHistory: 'Hipertensión controlada. Operación de rodilla 2019.',
        currentMedications: 'Losartan 50mg diario',
        previousCondition: 'Dolor crónico de rodilla derecha post-quirúrgico',
        currentCondition: 'Rehabilitación de rodilla, rango de movimiento 70% recuperado',
        generalObservations: 'Paciente muy colaborativa, asiste puntualmente. Buena adherencia al tratamiento.',
      },
    },
    {
      name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '7702-0002', dui: '02345678-9',
      gender: 'MALE' as const, birthDate: new Date('1990-08-22'),
      address: 'Col. San Benito, San Salvador', residence: 'San Salvador',
      profession: 'Ingeniero Civil', workplace: 'Constructora Latina',
      emergencyContact: 'Ana Pérez', emergencyPhone: '7702-9002',
      medical: {
        allergies: 'Ninguna conocida',
        medicalHistory: 'Lesión de rodilla izquierda 2023. Deportista activo.',
        currentMedications: 'Ibuprofeno 400mg según necesidad',
        previousCondition: 'Tendinitis rotuliana bilateral leve',
        currentCondition: 'Dolor en rodilla izquierda tras carrera de 10k. Inflamación moderada.',
        generalObservations: 'Atleta amateur. Corrige técnica de carrera en paralelo.',
      },
    },
    {
      name: 'Carmen Rodríguez', email: 'carmen.rodriguez@email.com', phone: '7703-0003', dui: '03456789-0',
      gender: 'FEMALE' as const, birthDate: new Date('1968-12-03'),
      address: 'Col. Miramonte, San Salvador', residence: 'San Salvador',
      profession: 'Contadora', workplace: 'Despacho Rodríguez & Asociados',
      insuranceCompany: 'La Centroamericana', affiliateNumber: 'LC-55001',
      emergencyContact: 'Roberto Rodríguez', emergencyPhone: '7703-9003',
      medical: {
        allergies: 'Látex, AINES',
        medicalHistory: 'Artritis reumatoide diagnosticada 2015. Diabetes tipo 2 controlada.',
        currentMedications: 'Metformina 500mg, Metotrexato 10mg semanal, Ácido fólico 5mg',
        previousCondition: 'Artritis reumatoide activa con brotes frecuentes. Manos y pies afectados.',
        currentCondition: 'Control de síntomas. Mejoría en rigidez matutina. Dolor leve-moderado.',
        generalObservations: 'Coordinación con reumatólogo. Ejercicios de bajo impacto únicamente.',
      },
    },
    {
      name: 'Luis Martínez', email: 'luis.martinez@email.com', phone: '7704-0004', dui: '04567890-1',
      gender: 'MALE' as const, birthDate: new Date('1998-03-18'),
      address: 'Col. Cuscatlán, Santa Tecla', residence: 'Santa Tecla',
      profession: 'Estudiante', workplace: 'Universidad Don Bosco',
      emergencyContact: 'Sofía Martínez', emergencyPhone: '7704-9004',
      medical: {
        allergies: 'Ninguna',
        medicalHistory: 'Fractura de cúbito y radio derechos (accidente moto, enero 2026). Cirugía con placa y tornillos.',
        currentMedications: 'Calcio + Vitamina D',
        previousCondition: 'Fractura post-quirúrgica brazo derecho. Inmovilización 8 semanas.',
        currentCondition: 'Rehabilitación activa. Fuerza 3/5. Rango de movimiento 60% restaurado.',
        generalObservations: 'Joven muy motivado. Excelente adherencia. Progreso rápido.',
      },
    },
    {
      name: 'Ana López', email: 'ana.lopez@email.com', phone: '7705-0005', dui: '05678901-2',
      gender: 'FEMALE' as const, birthDate: new Date('1988-07-25'),
      address: 'Col. San Francisco, San Salvador', residence: 'San Salvador',
      profession: 'Analista de Sistemas', workplace: 'Banco Agrícola',
      emergencyContact: 'Miguel López', emergencyPhone: '7705-9005',
      medical: {
        allergies: 'Aspirina',
        medicalHistory: 'Lumbalgia crónica desde 2021. Hernia discal L4-L5 leve.',
        currentMedications: 'Paracetamol 500mg según necesidad, Diclofenaco gel',
        previousCondition: 'Dolor lumbar crónico con irradiación a pierna derecha (ciática ocasional)',
        currentCondition: 'Control del dolor. Mejora postural. Núcleo abdominal fortaleciendo.',
        generalObservations: 'Trabajo sedentario 8h/día. Se realizan pausas activas. Ergonomía mejorada.',
      },
    },
    {
      name: 'Roberto Sánchez', email: 'roberto.sanchez@email.com', phone: '7706-0006', dui: '06789012-3',
      gender: 'MALE' as const, birthDate: new Date('1979-11-10'),
      address: 'Col. Las Colinas, Antiguo Cuscatlán', residence: 'Antiguo Cuscatlán',
      profession: 'Gerente de Ventas', workplace: 'Distribuidora Centroamérica',
      insuranceCompany: 'ASESUISA', affiliateNumber: 'ASE-77890',
      emergencyContact: 'Patricia Sánchez', emergencyPhone: '7706-9006',
      medical: {
        allergies: 'Ninguna conocida',
        medicalHistory: 'Rotura del manguito rotador hombro derecho. Artroscopía marzo 2026.',
        currentMedications: 'Calcio + Vitamina D, Omega-3',
        previousCondition: 'Dolor hombro derecho. Incapacidad para elevar brazo sobre 90°.',
        currentCondition: 'Post-operatorio semana 8. Rango de movimiento: flexión 100°, abducción 80°.',
        generalObservations: 'Evolución favorable. Trabaja con laptop, se le recomienda soporte de brazo.',
      },
    },
    {
      name: 'Sofía Hernández', email: 'sofia.hernandez@email.com', phone: '7707-0007', dui: '07890123-4',
      gender: 'FEMALE' as const, birthDate: new Date('1995-04-30'),
      address: 'Col. La Mascota, San Salvador', residence: 'San Salvador',
      profession: 'Médico', workplace: 'Hospital Nacional Rosales',
      emergencyContact: 'Diego Hernández', emergencyPhone: '7707-9007',
      medical: {
        allergies: 'Polvo, Ácaros',
        medicalHistory: 'Epicondilitis lateral (codo de tenista) brazo derecho. Inicio progresivo.',
        currentMedications: 'Ninguno actualmente',
        previousCondition: 'Dolor lateral del codo derecho. Agravado con pronación-supinación.',
        currentCondition: 'Mejora significativa. Dolor reducido a 3/10. Continúa con ejercicios excéntricos.',
        generalObservations: 'Médica, usa brazo derecho intensivamente. Control ergonómico del instrumental.',
      },
    },
    {
      name: 'Carlos Ramírez', email: 'carlos.ramirez@email.com', phone: '7708-0008', dui: '08901234-5',
      gender: 'MALE' as const, birthDate: new Date('1972-09-14'),
      address: 'Res. San Mateo, Soyapango', residence: 'Soyapango',
      profession: 'Electricista', workplace: 'Empresa propia',
      emergencyContact: 'Laura Ramírez', emergencyPhone: '7708-9008',
      medical: {
        allergies: 'Ninguna',
        medicalHistory: 'Síndrome del túnel carpiano bilateral. Más severo en mano derecha.',
        currentMedications: 'Ninguno',
        previousCondition: 'Hormigueo y dolor nocturno en manos. Pérdida de fuerza de agarre.',
        currentCondition: 'Post-cirugía túnel carpiano mano derecha. Liberación del nervio mediano exitosa.',
        generalObservations: 'Trabajo manual intensivo. Necesita retorno progresivo al trabajo.',
      },
    },
  ];

  const patients: any[] = [];
  for (const pd of patientsData) {
    const { medical, ...pInfo } = pd;
    const existing = await prisma.patient.findUnique({ where: { email: pInfo.email } });
    if (existing) {
      const full = await prisma.patient.findUnique({ where: { id: existing.id }, include: { medicalProfile: true } });
      patients.push(full);
      console.log(`   ⏭️  Ya existe: ${existing.name}`);
      continue;
    }
    const p = await prisma.patient.create({
      data: {
        ...pInfo,
        medicalProfile: {
          create: medical,
        },
      },
      include: { medicalProfile: true },
    });
    patients.push(p);
    console.log(`   ✅ ${p.name}`);
  }
  console.log();

  // ─────────────────────────────────────────────
  // DIAGNÓSTICOS
  // ─────────────────────────────────────────────
  console.log('🔬 Creando diagnósticos...');
  const diagnosesData = [
    { idx: 0, clinical: 'Síndrome post-quirúrgico rodilla derecha (Artroplastia)', status: 'ACTIVE' as const, observations: 'Dolor e inflamación residual. Limitación funcional moderada. Indicada fisioterapia intensiva.' },
    { idx: 1, clinical: 'Tendinitis rotuliana rodilla izquierda', status: 'ACTIVE' as const, observations: 'Inflamación del tendón rotuliano. Relacionado con sobre-entrenamiento de carrera.' },
    { idx: 2, clinical: 'Artritis reumatoide - compromiso manos y pies', status: 'CHRONIC' as const, observations: 'Enfermedad autoinmune controlada con Metotrexato. Fisioterapia de mantenimiento.' },
    { idx: 3, clinical: 'Fractura consolidada de cúbito y radio derechos', status: 'ACTIVE' as const, observations: 'Fractura consolidada radiológicamente. Fisioterapia para recuperar función y fuerza.' },
    { idx: 4, clinical: 'Hernia discal L4-L5 con lumbalgia crónica', status: 'CHRONIC' as const, observations: 'Hernia leve confirmada por RM. Manejo conservador. Sin indicación quirúrgica.' },
    { idx: 5, clinical: 'Rotura manguito rotador hombro derecho (post-artroscopía)', status: 'ACTIVE' as const, observations: 'Post-quirúrgico semana 8. Reparación de tendón supraespinoso y subescapular.' },
    { idx: 6, clinical: 'Epicondilitis lateral (codo de tenista) brazo derecho', status: 'RESOLVED' as const, observations: 'Episodio resuelto. Alta con programa de mantenimiento.' },
    { idx: 7, clinical: 'Síndrome del túnel carpiano mano derecha (post-liberación)', status: 'ACTIVE' as const, observations: 'Cirugía de descompresión del nervio mediano. Rehabilitación post-quirúrgica.' },
  ];

  const diagnoses: any[] = [];
  for (const dd of diagnosesData) {
    const p = patients[dd.idx];
    if (!p?.medicalProfile) { diagnoses.push(null); continue; }
    const existing = await prisma.diagnosis.findFirst({ where: { patientId: p.id, clinicalDiagnosis: dd.clinical } });
    if (existing) { diagnoses.push(existing); console.log(`   ⏭️  Ya existe diagnóstico para ${p.name}`); continue; }
    const diag = await prisma.diagnosis.create({
      data: {
        patientId: p.id,
        medicalProfileId: p.medicalProfile.id,
        clinicalDiagnosis: dd.clinical,
        status: dd.status,
        observations: dd.observations,
        diagnosisDate: d(-30 - dd.idx * 5, 9),
      },
    });
    diagnoses.push(diag);
    console.log(`   ✅ ${p.name}: ${dd.clinical.substring(0, 50)}...`);
  }
  console.log();

  // ─────────────────────────────────────────────
  // PLANES DE TRATAMIENTO
  // ─────────────────────────────────────────────
  console.log('📋 Creando planes de tratamiento...');
  const plansData = [
    { idx: 0, diagIdx: 0, title: 'Rehabilitación Post-Artroplastia Rodilla', therapyType: 'Rehabilitación Post-Quirúrgica', frequency: '3 veces por semana', sessionDuration: 60, sessionsPlanned: 24, sessionsCompleted: 14, status: 'ACTIVE' as const, totalCost: 1200, startDate: d(-45, 8), endDate: d(30, 8), description: 'Protocolo de rehabilitación completo post-reemplazo de rodilla. Incluye fortalecimiento muscular, recuperación del rango de movimiento y reentrenamiento funcional.', goals: 'Recuperar rango de movimiento completo. Fortalecer cuádriceps y gemelos. Retorno a actividades cotidianas sin dolor.' },
    { idx: 1, diagIdx: 1, title: 'Tratamiento Tendinitis Rotuliana', therapyType: 'Fisioterapia Deportiva', frequency: '2 veces por semana', sessionDuration: 45, sessionsPlanned: 12, sessionsCompleted: 7, status: 'ACTIVE' as const, totalCost: 540, startDate: d(-28, 8), endDate: d(14, 8), description: 'Programa de tratamiento para tendinitis rotuliana con énfasis en ejercicios excéntricos y terapia manual.', goals: 'Reducir dolor a menos de 2/10. Retorno progresivo al entrenamiento. Prevención de recaídas.' },
    { idx: 2, diagIdx: 2, title: 'Fisioterapia de Mantenimiento - Artritis Reumatoide', therapyType: 'Terapia Manual', frequency: '1 vez por semana', sessionDuration: 45, sessionsPlanned: 20, sessionsCompleted: 18, status: 'ACTIVE' as const, totalCost: 900, startDate: d(-120, 8), endDate: d(14, 8), description: 'Programa de fisioterapia de mantenimiento para control de síntomas de artritis reumatoide. Énfasis en movilidad articular y calidad de vida.', goals: 'Mantener movilidad articular. Reducir rigidez matutina. Mejorar calidad de vida.' },
    { idx: 3, diagIdx: 3, title: 'Rehabilitación Post-Fractura Brazo Derecho', therapyType: 'Fisioterapia Ortopédica', frequency: '3 veces por semana', sessionDuration: 60, sessionsPlanned: 20, sessionsCompleted: 9, status: 'ACTIVE' as const, totalCost: 1000, startDate: d(-35, 8), endDate: d(25, 8), description: 'Rehabilitación intensiva después de fractura y cirugía de cúbito y radio. Recuperación de fuerza y función del brazo derecho.', goals: 'Recuperar fuerza muscular a 5/5. Restaurar rango de movimiento completo. Retorno a actividades académicas.' },
    { idx: 4, diagIdx: 4, title: 'Manejo Conservador Lumbalgia Crónica', therapyType: 'Fisioterapia Ortopédica', frequency: '2 veces por semana', sessionDuration: 60, sessionsPlanned: 16, sessionsCompleted: 5, status: 'ACTIVE' as const, totalCost: 800, startDate: d(-20, 8), endDate: d(45, 8), description: 'Plan de manejo conservador para lumbalgia crónica con hernia discal L4-L5. Control del dolor y fortalecimiento del núcleo.', goals: 'Reducir dolor lumbar crónico. Fortalecer musculatura del core. Educación postural.' },
    { idx: 5, diagIdx: 5, title: 'Rehabilitación Manguito Rotador Hombro Derecho', therapyType: 'Rehabilitación Post-Quirúrgica', frequency: '3 veces por semana', sessionDuration: 60, sessionsPlanned: 24, sessionsCompleted: 6, status: 'ACTIVE' as const, totalCost: 1200, startDate: d(-18, 8), endDate: d(55, 8), description: 'Protocolo de rehabilitación post-artroscopía de hombro. Fases progresivas de recuperación de rango de movimiento y fuerza.', goals: 'Recuperar rango de movimiento completo de hombro. Fortalecer manguito rotador. Retorno al trabajo.' },
    { idx: 6, diagIdx: 6, title: 'Tratamiento Epicondilitis Lateral - Alta', therapyType: 'Fisioterapia Deportiva', frequency: '2 veces por semana', sessionDuration: 45, sessionsPlanned: 10, sessionsCompleted: 10, status: 'COMPLETED' as const, totalCost: 450, startDate: d(-70, 8), endDate: d(-10, 8), description: 'Tratamiento completado exitosamente. Resolución de epicondilitis lateral con ejercicios excéntricos y terapia manual.', goals: 'Resolución del dolor. Retorno a la práctica médica sin limitaciones.' },
    { idx: 7, diagIdx: 7, title: 'Rehabilitación Post-Liberación Túnel Carpiano', therapyType: 'Fisioterapia Ortopédica', frequency: '2 veces por semana', sessionDuration: 45, sessionsPlanned: 12, sessionsCompleted: 2, status: 'ACTIVE' as const, totalCost: 540, startDate: d(-8, 8), endDate: d(50, 8), description: 'Rehabilitación post-quirúrgica del túnel carpiano. Cicatrización y recuperación de la función de la mano.', goals: 'Recuperar sensibilidad y fuerza. Retorno al trabajo manual. Prevenir recurrencia.' },
  ];

  const plans: any[] = [];
  for (const pd of plansData) {
    const p = patients[pd.idx];
    const diag = diagnoses[pd.diagIdx];
    if (!p) { plans.push(null); continue; }
    const existing = await prisma.treatmentPlan.findFirst({ where: { patientId: p.id, title: pd.title } });
    if (existing) { plans.push(existing); console.log(`   ⏭️  Ya existe plan: ${pd.title.substring(0, 45)}...`); continue; }
    const plan = await prisma.treatmentPlan.create({
      data: {
        patientId: p.id,
        diagnosisId: diag?.id || null,
        title: pd.title,
        therapyType: pd.therapyType,
        description: pd.description,
        goals: pd.goals,
        frequency: pd.frequency,
        sessionDuration: pd.sessionDuration,
        sessionsPlanned: pd.sessionsPlanned,
        sessionsCompleted: pd.sessionsCompleted,
        totalCost: pd.totalCost,
        status: pd.status,
        startDate: pd.startDate,
        endDate: pd.endDate,
      },
    });
    plans.push(plan);
    console.log(`   ✅ ${pd.title.substring(0, 50)}...`);
  }
  console.log();

  // ─────────────────────────────────────────────
  // CITAS DEL CALENDARIO (3 semanas)
  // ─────────────────────────────────────────────
  console.log('📅 Creando citas del calendario...');

  interface AppointmentSeed {
    patientIdx: number;
    therapistRef: any;
    planIdx: number | null;
    offsetDays: number;
    hour: number;
    duration: number;
    status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    notes?: string;
  }

  const apptSeed: AppointmentSeed[] = [
    // ── Pasado (semana -2) ──
    { patientIdx: 0, therapistRef: t1, planIdx: 0, offsetDays: -14, hour: 8,  duration: 60, status: 'COMPLETED' },
    { patientIdx: 1, therapistRef: t1, planIdx: 1, offsetDays: -14, hour: 10, duration: 45, status: 'COMPLETED' },
    { patientIdx: 2, therapistRef: t2, planIdx: 2, offsetDays: -14, hour: 15, duration: 45, status: 'COMPLETED' },
    { patientIdx: 3, therapistRef: t3, planIdx: 3, offsetDays: -13, hour: 9,  duration: 60, status: 'COMPLETED' },
    { patientIdx: 4, therapistRef: t2, planIdx: 4, offsetDays: -13, hour: 11, duration: 60, status: 'COMPLETED' },
    { patientIdx: 5, therapistRef: t1, planIdx: 5, offsetDays: -12, hour: 14, duration: 60, status: 'COMPLETED' },
    { patientIdx: 6, therapistRef: t2, planIdx: 6, offsetDays: -12, hour: 16, duration: 45, status: 'COMPLETED' },
    { patientIdx: 7, therapistRef: t3, planIdx: 7, offsetDays: -12, hour: 10, duration: 45, status: 'COMPLETED' },
    { patientIdx: 0, therapistRef: t1, planIdx: 0, offsetDays: -11, hour: 8,  duration: 60, status: 'COMPLETED' },
    { patientIdx: 3, therapistRef: t3, planIdx: 3, offsetDays: -11, hour: 13, duration: 60, status: 'NO_SHOW',   notes: 'Paciente no se presentó. Llamar para reprogramar.' },
    { patientIdx: 1, therapistRef: t1, planIdx: 1, offsetDays: -10, hour: 10, duration: 45, status: 'COMPLETED' },
    { patientIdx: 2, therapistRef: t2, planIdx: 2, offsetDays: -10, hour: 15, duration: 45, status: 'COMPLETED' },
    { patientIdx: 4, therapistRef: t2, planIdx: 4, offsetDays: -10, hour: 11, duration: 60, status: 'CANCELLED', notes: 'Paciente canceló por gripe. Reagendada.' },

    // ── Pasado (semana -1) ──
    { patientIdx: 5, therapistRef: t1, planIdx: 5, offsetDays: -7, hour: 14, duration: 60, status: 'COMPLETED' },
    { patientIdx: 0, therapistRef: t1, planIdx: 0, offsetDays: -7, hour: 8,  duration: 60, status: 'COMPLETED' },
    { patientIdx: 3, therapistRef: t3, planIdx: 3, offsetDays: -6, hour: 9,  duration: 60, status: 'COMPLETED' },
    { patientIdx: 7, therapistRef: t3, planIdx: 7, offsetDays: -6, hour: 11, duration: 45, status: 'COMPLETED' },
    { patientIdx: 1, therapistRef: t1, planIdx: 1, offsetDays: -5, hour: 10, duration: 45, status: 'COMPLETED' },
    { patientIdx: 2, therapistRef: t2, planIdx: 2, offsetDays: -5, hour: 15, duration: 45, status: 'COMPLETED' },
    { patientIdx: 4, therapistRef: t2, planIdx: 4, offsetDays: -5, hour: 11, duration: 60, status: 'COMPLETED' },
    { patientIdx: 6, therapistRef: t2, planIdx: 6, offsetDays: -4, hour: 16, duration: 45, status: 'COMPLETED' },
    { patientIdx: 5, therapistRef: t1, planIdx: 5, offsetDays: -4, hour: 14, duration: 60, status: 'COMPLETED' },
    { patientIdx: 0, therapistRef: t1, planIdx: 0, offsetDays: -3, hour: 8,  duration: 60, status: 'COMPLETED' },
    { patientIdx: 3, therapistRef: t3, planIdx: 3, offsetDays: -3, hour: 9,  duration: 60, status: 'COMPLETED' },

    // ── HOY (2026-05-09, Sábado) ──
    { patientIdx: 0, therapistRef: t1, planIdx: 0, offsetDays: 0, hour: 8,  duration: 60, status: 'CONFIRMED',  notes: 'Sesión 15 del plan. Control de flexión.' },
    { patientIdx: 1, therapistRef: t1, planIdx: 1, offsetDays: 0, hour: 9,  duration: 45, status: 'CONFIRMED' },
    { patientIdx: 4, therapistRef: t2, planIdx: 4, offsetDays: 0, hour: 10, duration: 60, status: 'SCHEDULED' },
    { patientIdx: 7, therapistRef: t3, planIdx: 7, offsetDays: 0, hour: 11, duration: 45, status: 'SCHEDULED' },
    { patientIdx: 5, therapistRef: t1, planIdx: 5, offsetDays: 0, hour: 14, duration: 60, status: 'CONFIRMED' },
    { patientIdx: 3, therapistRef: t3, planIdx: 3, offsetDays: 0, hour: 15, duration: 60, status: 'SCHEDULED' },

    // ── Próxima semana - Lunes 11 ──
    { patientIdx: 0, therapistRef: t1, planIdx: 0, offsetDays: 2, hour: 8,  duration: 60, status: 'SCHEDULED' },
    { patientIdx: 2, therapistRef: t2, planIdx: 2, offsetDays: 2, hour: 9,  duration: 45, status: 'SCHEDULED' },
    { patientIdx: 3, therapistRef: t3, planIdx: 3, offsetDays: 2, hour: 10, duration: 60, status: 'SCHEDULED' },
    { patientIdx: 5, therapistRef: t1, planIdx: 5, offsetDays: 2, hour: 14, duration: 60, status: 'SCHEDULED' },
    { patientIdx: 7, therapistRef: t3, planIdx: 7, offsetDays: 2, hour: 15, duration: 45, status: 'SCHEDULED' },

    // ── Próxima semana - Martes 12 ──
    { patientIdx: 1, therapistRef: t1, planIdx: 1, offsetDays: 3, hour: 9,  duration: 45, status: 'SCHEDULED' },
    { patientIdx: 4, therapistRef: t2, planIdx: 4, offsetDays: 3, hour: 10, duration: 60, status: 'SCHEDULED' },
    { patientIdx: 6, therapistRef: t2, planIdx: 6, offsetDays: 3, hour: 14, duration: 45, status: 'SCHEDULED' },

    // ── Próxima semana - Miércoles 13 ──
    { patientIdx: 0, therapistRef: t1, planIdx: 0, offsetDays: 4, hour: 8,  duration: 60, status: 'SCHEDULED' },
    { patientIdx: 3, therapistRef: t3, planIdx: 3, offsetDays: 4, hour: 9,  duration: 60, status: 'SCHEDULED' },
    { patientIdx: 5, therapistRef: t1, planIdx: 5, offsetDays: 4, hour: 14, duration: 60, status: 'SCHEDULED' },
    { patientIdx: 2, therapistRef: t2, planIdx: 2, offsetDays: 4, hour: 15, duration: 45, status: 'SCHEDULED' },

    // ── Próxima semana - Jueves 14 ──
    { patientIdx: 1, therapistRef: t1, planIdx: 1, offsetDays: 5, hour: 10, duration: 45, status: 'SCHEDULED' },
    { patientIdx: 4, therapistRef: t2, planIdx: 4, offsetDays: 5, hour: 11, duration: 60, status: 'SCHEDULED' },
    { patientIdx: 7, therapistRef: t3, planIdx: 7, offsetDays: 5, hour: 14, duration: 45, status: 'SCHEDULED' },

    // ── Próxima semana - Viernes 15 ──
    { patientIdx: 0, therapistRef: t1, planIdx: 0, offsetDays: 6, hour: 8,  duration: 60, status: 'SCHEDULED' },
    { patientIdx: 3, therapistRef: t3, planIdx: 3, offsetDays: 6, hour: 9,  duration: 60, status: 'SCHEDULED' },
    { patientIdx: 5, therapistRef: t1, planIdx: 5, offsetDays: 6, hour: 14, duration: 60, status: 'SCHEDULED' },
    { patientIdx: 6, therapistRef: t2, planIdx: 6, offsetDays: 6, hour: 16, duration: 45, status: 'SCHEDULED' },

    // ── Semana +2 ──
    { patientIdx: 2, therapistRef: t2, planIdx: 2, offsetDays: 9,  hour: 9,  duration: 45, status: 'SCHEDULED' },
    { patientIdx: 0, therapistRef: t1, planIdx: 0, offsetDays: 9,  hour: 8,  duration: 60, status: 'SCHEDULED' },
    { patientIdx: 4, therapistRef: t2, planIdx: 4, offsetDays: 10, hour: 10, duration: 60, status: 'SCHEDULED' },
    { patientIdx: 1, therapistRef: t1, planIdx: 1, offsetDays: 10, hour: 14, duration: 45, status: 'SCHEDULED' },
    { patientIdx: 7, therapistRef: t3, planIdx: 7, offsetDays: 12, hour: 11, duration: 45, status: 'SCHEDULED' },
    { patientIdx: 5, therapistRef: t1, planIdx: 5, offsetDays: 11, hour: 14, duration: 60, status: 'SCHEDULED' },
    { patientIdx: 3, therapistRef: t3, planIdx: 3, offsetDays: 11, hour: 9,  duration: 60, status: 'SCHEDULED' },
  ];

  const appointments: any[] = [];
  let apptCreated = 0;
  for (const a of apptSeed) {
    const p = patients[a.patientIdx];
    const plan = a.planIdx !== null ? plans[a.planIdx] : null;
    if (!p) continue;
    const apptDate = d(a.offsetDays, a.hour);
    const existing = await prisma.appointment.findFirst({
      where: { therapistId: a.therapistRef.id, appointmentDate: apptDate },
    });
    if (existing) { appointments.push(existing); continue; }
    const appt = await prisma.appointment.create({
      data: {
        patientId: p.id,
        therapistId: a.therapistRef.id,
        treatmentPlanId: plan?.id || null,
        appointmentDate: apptDate,
        duration: a.duration,
        status: a.status,
        notes: a.notes || null,
      },
    });
    appointments.push(appt);
    apptCreated++;
  }
  console.log(`   ✅ ${apptCreated} citas creadas\n`);

  // ─────────────────────────────────────────────
  // SESIONES (solo para citas COMPLETED)
  // ─────────────────────────────────────────────
  console.log('💼 Creando sesiones de tratamiento...');

  const sessionNotes = [
    { interventions: 'Crioterapia + ejercicios activos de rodilla. Bicicleta estática 15 min.', progress: 'Flexión mejoró 10°. Dolor post-sesión controlado.', painLevel: 5 },
    { interventions: 'Ejercicios excéntricos tendón rotuliano. Ultrasonido terapéutico 10 min.', progress: 'Dolor al descender escaleras reducido de 7 a 5.', painLevel: 5 },
    { interventions: 'Movilización articular manos. Termoterapia 15 min. Ejercicios de agarre.', progress: 'Rigidez matutina de 45 min a 30 min.', painLevel: 4 },
    { interventions: 'Movilización pasiva codo y muñeca. Electroestimulación TENS.', progress: 'Rango de movimiento de codo: 80° a 90°.', painLevel: 6 },
    { interventions: 'Ejercicios de fortalecimiento core. Tracción lumbar manual.', progress: 'Dolor lumbar reducido de 6 a 4. Postura mejorada.', painLevel: 4 },
    { interventions: 'Péndulo de Codman. Movilización glenohumeral suave. Frío 10 min.', progress: 'Abducción aumentó 10°. Menos dolor nocturno.', painLevel: 5 },
    { interventions: 'Ejercicios excéntricos de codo. Masaje transversal profundo.', progress: 'Dolor funcional de 4 a 2. Casi asintomático.', painLevel: 2 },
    { interventions: 'Movilización tendon flexores. Ejercicios de pinza fina.', progress: 'Sensibilidad recuperando. Fuerza de agarre 3/5.', painLevel: 3 },
  ];

  let sessionsCreated = 0;
  for (let i = 0; i < appointments.length; i++) {
    const appt = appointments[i];
    if (!appt || appt.status !== 'COMPLETED') continue;
    const existing = await prisma.treatmentSession.findFirst({ where: { appointmentId: appt.id } });
    if (existing) continue;

    const seed = apptSeed[i];
    const plan = seed.planIdx !== null ? plans[seed.planIdx] : null;
    const notes = sessionNotes[seed.patientIdx % sessionNotes.length];

    await prisma.treatmentSession.create({
      data: {
        patientId: appt.patientId,
        therapistId: appt.therapistId,
        treatmentPlanId: plan?.id || null,
        appointmentId: appt.id,
        sessionDate: appt.appointmentDate,
        duration: appt.duration,
        attendanceStatus: 'ATTENDED',
        attendanceConfirmedAt: appt.appointmentDate,
        interventions: notes.interventions,
        progress: notes.progress,
        painLevel: notes.painLevel,
        notes: 'Sesión sin incidentes.',
      },
    });
    sessionsCreated++;
  }
  console.log(`   ✅ ${sessionsCreated} sesiones creadas\n`);

  // ─────────────────────────────────────────────
  // PAGOS
  // ─────────────────────────────────────────────
  console.log('💰 Creando pagos...');
  const sessions = await prisma.treatmentSession.findMany({ where: { attendanceStatus: 'ATTENDED' }, take: 20, include: { treatmentPlan: true } });
  const methods = ['CASH', 'POS', 'TRANSFER'] as const;
  let paymentsCreated = 0;
  for (let i = 0; i < sessions.length; i++) {
    const sess = sessions[i];
    const existing = await prisma.payment.findFirst({ where: { sessionId: sess.id } });
    if (existing) continue;
    await prisma.payment.create({
      data: {
        patientId: sess.patientId,
        sessionId: sess.id,
        treatmentPlanId: sess.treatmentPlanId || null,
        amount: 50,
        paymentDate: new Date(sess.sessionDate),
        method: methods[i % 3],
        status: 'COMPLETED',
        notes: `Pago sesión ${i + 1}`,
      },
    });
    paymentsCreated++;
  }
  console.log(`   ✅ ${paymentsCreated} pagos creados\n`);

  // ─────────────────────────────────────────────
  // NOTAS DEL TERAPISTA
  // ─────────────────────────────────────────────
  console.log('📝 Creando notas clínicas...');
  const notesData = [
    { pIdx: 0, tRef: t1, content: 'Paciente muestra excelente adherencia al tratamiento. La fuerza del cuádriceps ha mejorado de 3/5 a 4/5. Continuar con progresión de carga. Próxima sesión: aumentar resistencia en bicicleta.' },
    { pIdx: 1, tRef: t1, content: 'Se detectó mal patrón de carrera en video analysis. Se inició corrección de técnica. El dolor mejora con carga excéntrica. Recomiendo reducir volumen de entrenamiento 30% por 2 semanas.' },
    { pIdx: 2, tRef: t2, content: 'Brote leve de artritis en manos. Se ajustó el programa reduciendo carga articular. Se coordinó con reumatólogo para posible ajuste de Metotrexato. Próxima evaluación en 2 semanas.' },
    { pIdx: 3, tRef: t3, content: 'Excelente progreso en rehabilitación. El joven es muy disciplinado con los ejercicios en casa. Rango de movimiento del codo alcanzó 110°. Iniciando ejercicios de fuerza resistida.' },
    { pIdx: 4, tRef: t2, content: 'La paciente ha cambiado su estación de trabajo a sugerencia de este terapeuta. Postura mejorada significativamente. El dolor bajó de 6 a 3 durante actividades laborales. Continuar con fortalecimiento de núcleo.' },
    { pIdx: 5, tRef: t1, content: 'Post-quirúrgico evoluciona favorablemente. Se inició fase 2 del protocolo de rehabilitación. El paciente tolera bien la carga. Flexión activa del hombro ya alcanza 100°. Muy buen pronóstico.' },
  ];

  let notesCreated = 0;
  for (const nd of notesData) {
    const p = patients[nd.pIdx];
    if (!p?.medicalProfile) continue;
    const existing = await prisma.therapistNote.findFirst({ where: { patientId: p.id, therapistId: nd.tRef.id, content: nd.content } });
    if (existing) continue;
    await prisma.therapistNote.create({
      data: {
        patientId: p.id,
        therapistId: nd.tRef.id,
        medicalProfileId: p.medicalProfile.id,
        content: nd.content,
      },
    });
    notesCreated++;
  }
  console.log(`   ✅ ${notesCreated} notas clínicas creadas\n`);

  // ─────────────────────────────────────────────
  // EVALUACIONES
  // ─────────────────────────────────────────────
  console.log('📊 Creando evaluaciones...');
  const evalsData = [
    // Iniciales
    { pIdx: 0, type: 'INITIAL' as const, daysAgo: 50, painLevel: 8, rom: 'Flexión: 60°, Extensión: 0°. Limitada.', strength: '3/5 cuádriceps, 3/5 gemelos', functional: 'No puede subir escaleras sin apoyo. Marcha con cojera.' },
    { pIdx: 1, type: 'INITIAL' as const, daysAgo: 32, painLevel: 7, rom: 'ROM completo. Dolor a la palpación del tendón rotuliano.', strength: '4/5 bilateral', functional: 'Dolor al correr y bajar escaleras. Deporte limitado.' },
    { pIdx: 2, type: 'INITIAL' as const, daysAgo: 125, painLevel: 6, rom: 'Flexión MCF: 60°. Rigidez matutina 60 minutos.', strength: '3/5 agarre bilateral', functional: 'Dificultad para actividades de la vida diaria. Dolor matutino severo.' },
    { pIdx: 3, type: 'INITIAL' as const, daysAgo: 40, painLevel: 7, rom: 'Codo: 45-80°. Muñeca: 30° flex/ext. Pronosupinación 50%.', strength: '2/5 brazo derecho', functional: 'No puede usar el brazo derecho para actividades básicas.' },
    { pIdx: 4, type: 'INITIAL' as const, daysAgo: 25, painLevel: 6, rom: 'Columna: limitación en extensión y rotación derecha.', strength: '3/5 musculatura lumbar', functional: 'Dolor al estar sentado >30 min. Limita actividad laboral.' },
    // Progreso
    { pIdx: 0, type: 'PROGRESS' as const, daysAgo: 20, painLevel: 4, rom: 'Flexión: 90°, Extensión: -5°. Mejora progresiva.', strength: '4/5 cuádriceps', functional: 'Sube escaleras con apoyo leve. Marcha casi normal.' },
    { pIdx: 1, type: 'PROGRESS' as const, daysAgo: 14, painLevel: 3, rom: 'ROM completo sin dolor. Tendón menos sensible.', strength: '4/5 bilateral, mejorando', functional: 'Puede trotar 20 min sin dolor. Escaleras sin dificultad.' },
    { pIdx: 3, type: 'PROGRESS' as const, daysAgo: 15, painLevel: 5, rom: 'Codo: 30-110°. Muñeca: 50° flex/ext. Pronosupinación 75%.', strength: '3/5 brazo derecho, mejorando', functional: 'Puede comer solo. Usa teclado con apoyo.' },
    // Final
    { pIdx: 6, type: 'FINAL' as const, daysAgo: 12, painLevel: 1, rom: 'ROM completo sin dolor. Prueba de Thomson negativa.', strength: '5/5 bilateral', functional: 'Actividades laborales sin limitación. Alta médica.' },
  ];

  let evalsCreated = 0;
  for (const ev of evalsData) {
    const p = patients[ev.pIdx];
    if (!p) continue;
    const evalDate = d(-ev.daysAgo, 9);
    const existing = await prisma.evaluation.findFirst({ where: { patientId: p.id, evaluationType: ev.type, evaluationDate: evalDate } });
    if (existing) continue;
    await prisma.evaluation.create({
      data: {
        patientId: p.id,
        evaluationType: ev.type,
        evaluationDate: evalDate,
        painLevel: ev.painLevel,
        rangeOfMotion: ev.rom,
        strength: ev.strength,
        functionalAssessment: ev.functional,
      },
    });
    evalsCreated++;
  }
  console.log(`   ✅ ${evalsCreated} evaluaciones creadas\n`);

  // ─────────────────────────────────────────────
  // RESUMEN FINAL
  // ─────────────────────────────────────────────
  const totals = await Promise.all([
    prisma.patient.count(),
    prisma.therapist.count(),
    prisma.appointment.count(),
    prisma.treatmentSession.count(),
    prisma.treatmentPlan.count(),
    prisma.payment.count(),
    prisma.evaluation.count(),
    prisma.therapistNote.count(),
    prisma.diagnosis.count(),
  ]);

  console.log('✨ Seed completado!\n');
  console.log('📊 Totales en base de datos:');
  console.log(`   👥 Pacientes:             ${totals[0]}`);
  console.log(`   👨‍⚕️ Terapistas:            ${totals[1]}`);
  console.log(`   📅 Citas:                 ${totals[2]}`);
  console.log(`   💼 Sesiones:              ${totals[3]}`);
  console.log(`   📋 Planes de tratamiento: ${totals[4]}`);
  console.log(`   💰 Pagos:                 ${totals[5]}`);
  console.log(`   📊 Evaluaciones:          ${totals[6]}`);
  console.log(`   📝 Notas clínicas:        ${totals[7]}`);
  console.log(`   🔬 Diagnósticos:          ${totals[8]}`);
  console.log('\n🔐 Credenciales: admin@clinica.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
