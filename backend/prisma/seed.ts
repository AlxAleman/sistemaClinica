import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Crear pacientes de ejemplo
  const patients = [
    {
      name: 'María González',
      email: 'maria.gonzalez@email.com',
      phone: '2222-1234',
      dui: '01234567-8',
      gender: 'FEMALE' as const,
      birthDate: new Date('1985-05-15'),
      address: 'Colonia Escalón, San Salvador',
      emergencyContact: 'Carlos González',
      emergencyPhone: '2222-5678',
      medicalProfile: {
        allergies: 'Penicilina, Polen',
        medicalHistory: 'Hipertensión controlada, Sin cirugías previas',
        currentMedications: 'Losartan 50mg diario',
        notes: 'Paciente muy colaborativa, asiste puntualmente a sus citas',
      },
    },
    {
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '2234-5678',
      dui: '02345678-9',
      gender: 'MALE' as const,
      birthDate: new Date('1990-08-22'),
      address: 'Colonia San Benito, San Salvador',
      emergencyContact: 'Ana Pérez',
      emergencyPhone: '2234-9012',
      medicalProfile: {
        allergies: 'Ninguna conocida',
        medicalHistory: 'Lesión de rodilla en 2020, recuperación completa',
        currentMedications: 'Ibuprofeno 400mg según necesidad',
        notes: 'Deportista activo, requiere rehabilitación post-ejercicio',
      },
    },
    {
      name: 'Carmen Rodríguez',
      email: 'carmen.rodriguez@email.com',
      phone: '2245-6789',
      dui: '03456789-0',
      gender: 'FEMALE' as const,
      birthDate: new Date('1978-12-03'),
      address: 'Colonia Miramonte, San Salvador',
      emergencyContact: 'Roberto Rodríguez',
      emergencyPhone: '2245-3456',
      medicalProfile: {
        allergies: 'Látex',
        medicalHistory: 'Artritis reumatoide, Diabetes tipo 2',
        currentMedications: 'Metformina 500mg, Metotrexato semanal',
        notes: 'Requiere atención especial por condiciones crónicas',
      },
    },
    {
      name: 'Luis Martínez',
      email: 'luis.martinez@email.com',
      phone: '2256-7890',
      dui: '04567890-1',
      gender: 'MALE' as const,
      birthDate: new Date('1995-03-18'),
      address: 'Colonia Cuscatlán, San Salvador',
      emergencyContact: 'Sofía Martínez',
      emergencyPhone: '2256-2345',
      medicalProfile: {
        allergies: 'Ninguna',
        medicalHistory: 'Accidente de tránsito en 2023, fractura de brazo',
        currentMedications: 'Ninguno actualmente',
        notes: 'Joven paciente, muy motivado en su recuperación',
      },
    },
    {
      name: 'Ana López',
      email: 'ana.lopez@email.com',
      phone: '2267-8901',
      dui: '05678901-2',
      gender: 'FEMALE' as const,
      birthDate: new Date('1988-07-25'),
      address: 'Colonia San Francisco, San Salvador',
      emergencyContact: 'Miguel López',
      emergencyPhone: '2267-4567',
      medicalProfile: {
        allergies: 'Aspirina',
        medicalHistory: 'Dolor crónico de espalda, Sin cirugías',
        currentMedications: 'Paracetamol 500mg según necesidad',
        notes: 'Trabaja en oficina, requiere ejercicios posturales',
      },
    },
    {
      name: 'Roberto Sánchez',
      email: 'roberto.sanchez@email.com',
      phone: '2278-9012',
      dui: '06789012-3',
      gender: 'MALE' as const,
      birthDate: new Date('1982-11-10'),
      address: 'Colonia Las Colinas, San Salvador',
      emergencyContact: 'Patricia Sánchez',
      emergencyPhone: '2278-5678',
      medicalProfile: {
        allergies: 'Ninguna conocida',
        medicalHistory: 'Lesión de hombro en 2022, cirugía artroscópica',
        currentMedications: 'Ninguno',
        notes: 'En proceso de rehabilitación post-quirúrgica',
      },
    },
    {
      name: 'Sofía Hernández',
      email: 'sofia.hernandez@email.com',
      phone: '2289-0123',
      dui: '07890123-4',
      gender: 'FEMALE' as const,
      birthDate: new Date('1992-04-30'),
      address: 'Colonia La Mascota, San Salvador',
      emergencyContact: 'Diego Hernández',
      emergencyPhone: '2289-6789',
      medicalProfile: {
        allergies: 'Polvo, Ácaros',
        medicalHistory: 'Asma leve, Sin otras condiciones',
        currentMedications: 'Salbutamol inhalador según necesidad',
        notes: 'Paciente activa, practica yoga regularmente',
      },
    },
    {
      name: 'Carlos Ramírez',
      email: 'carlos.ramirez@email.com',
      phone: '2290-1234',
      dui: '08901234-5',
      gender: 'MALE' as const,
      birthDate: new Date('1975-09-14'),
      address: 'Colonia San Mateo, San Salvador',
      emergencyContact: 'Laura Ramírez',
      emergencyPhone: '2290-7890',
      medicalProfile: {
        allergies: 'Ninguna',
        medicalHistory: 'Hipertensión, Colesterol alto',
        currentMedications: 'Amlodipino 5mg, Atorvastatina 20mg',
        notes: 'Paciente de edad media, requiere seguimiento regular',
      },
    },
    {
      name: 'Patricia Morales',
      email: 'patricia.morales@email.com',
      phone: '2201-2345',
      dui: '09012345-6',
      gender: 'FEMALE' as const,
      birthDate: new Date('1998-01-20'),
      address: 'Colonia Las Palmas, San Salvador',
      emergencyContact: 'Fernando Morales',
      emergencyPhone: '2201-8901',
      medicalProfile: {
        allergies: 'Ninguna conocida',
        medicalHistory: 'Lesión deportiva de tobillo, Sin cirugías',
        currentMedications: 'Ninguno',
        notes: 'Estudiante universitaria, muy comprometida con su tratamiento',
      },
    },
    {
      name: 'Miguel Torres',
      email: 'miguel.torres@email.com',
      phone: '2212-3456',
      dui: '00123456-7',
      gender: 'MALE' as const,
      birthDate: new Date('1987-06-08'),
      address: 'Colonia Escalón, San Salvador',
      emergencyContact: 'Elena Torres',
      emergencyPhone: '2212-9012',
      medicalProfile: {
        allergies: 'Ninguna',
        medicalHistory: 'Dolor lumbar crónico, Sin cirugías',
        currentMedications: 'Diclofenaco 50mg según necesidad',
        notes: 'Trabajador de construcción, requiere fortalecimiento',
      },
    },
  ];

  console.log(`📝 Creando ${patients.length} pacientes...`);

  for (const patientData of patients) {
    const { medicalProfile, ...patientInfo } = patientData;
    
    // Buscar si ya existe un paciente con el mismo email o DUI
    const existingPatient = await prisma.patient.findFirst({
      where: {
        OR: [
          patientInfo.email ? { email: patientInfo.email } : {},
          patientInfo.dui ? { dui: patientInfo.dui } : {},
        ].filter(condition => Object.keys(condition).length > 0),
      },
    });

    if (existingPatient) {
      console.log(`⏭️  Paciente ya existe: ${patientInfo.name}`);
      continue;
    }

    const patient = await prisma.patient.create({
      data: {
        ...patientInfo,
        medicalProfile: {
          create: medicalProfile,
        },
      },
      include: {
        medicalProfile: true,
      },
    });

    console.log(`✅ Paciente creado: ${patient.name}`);
  }

  // Crear terapeutas de ejemplo
  const therapistsData = [
    {
      name: 'Dr. Carlos Méndez',
      email: 'carlos.mendez@clinica.com',
      phone: '2222-0001',
      specialization: 'Fisioterapia Deportiva',
      availability: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' }, // Lunes
        { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '08:00', endTime: '12:00' }, // Martes
        { dayOfWeek: 2, startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '12:00' }, // Miércoles
        { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '08:00', endTime: '12:00' }, // Jueves
        { dayOfWeek: 4, startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '12:00' }, // Viernes
      ],
    },
    {
      name: 'Dra. Ana Martínez',
      email: 'ana.martinez@clinica.com',
      phone: '2222-0002',
      specialization: 'Fisioterapia Neurológica',
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' }, // Lunes
        { dayOfWeek: 1, startTime: '15:00', endTime: '19:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '13:00' }, // Martes
        { dayOfWeek: 2, startTime: '15:00', endTime: '19:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '13:00' }, // Miércoles
        { dayOfWeek: 3, startTime: '15:00', endTime: '19:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '13:00' }, // Jueves
        { dayOfWeek: 4, startTime: '15:00', endTime: '19:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '13:00' }, // Viernes
      ],
    },
    {
      name: 'Lic. Roberto Silva',
      email: 'roberto.silva@clinica.com',
      phone: '2222-0003',
      specialization: 'Fisioterapia Ortopédica',
      availability: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '11:00' }, // Lunes
        { dayOfWeek: 1, startTime: '13:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '07:00', endTime: '11:00' }, // Miércoles
        { dayOfWeek: 3, startTime: '13:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '07:00', endTime: '11:00' }, // Viernes
        { dayOfWeek: 5, startTime: '13:00', endTime: '17:00' },
        { dayOfWeek: 6, startTime: '08:00', endTime: '12:00' }, // Sábado
      ],
    },
  ];

  console.log(`👨‍⚕️ Creando ${therapistsData.length} terapeutas...`);

  for (const therapistData of therapistsData) {
    const { availability, ...therapistInfo } = therapistData;

    // Verificar si el terapeuta ya existe
    const existingTherapist = await prisma.therapist.findUnique({
      where: { email: therapistInfo.email },
    });

    if (existingTherapist) {
      console.log(`⏭️  Terapeuta ya existe: ${therapistInfo.name}`);
      continue;
    }

    const therapist = await prisma.therapist.create({
      data: {
        ...therapistInfo,
        availability: {
          create: availability,
        },
      },
      include: {
        availability: true,
      },
    });

    console.log(`✅ Terapeuta creado: ${therapist.name} con ${therapist.availability.length} horarios de disponibilidad`);
  }

  // Crear citas de ejemplo
  console.log(`📅 Creando citas de ejemplo...`);

  // Obtener todos los pacientes y terapeutas
  const allPatients = await prisma.patient.findMany({ take: 10 });
  const allTherapists = await prisma.therapist.findMany();

  if (allPatients.length === 0 || allTherapists.length === 0) {
    console.log('⚠️  No hay pacientes o terapeutas para crear citas');
    console.log('✨ Seed completado exitosamente!');
    return;
  }

  // Crear citas para los próximos días con diferentes estados
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointmentsData = [
    // Citas para hoy
    {
      patientId: allPatients[0].id,
      therapistId: allTherapists[0].id,
      appointmentDate: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 09:00 hoy
      duration: 60,
      status: 'SCHEDULED' as const,
    },
    {
      patientId: allPatients[1].id,
      therapistId: allTherapists[0].id,
      appointmentDate: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11:00 hoy
      duration: 45,
      status: 'CONFIRMED' as const,
    },
    {
      patientId: allPatients[2].id,
      therapistId: allTherapists[1].id,
      appointmentDate: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 15:00 hoy
      duration: 60,
      status: 'SCHEDULED' as const,
    },
    // Citas para mañana
    {
      patientId: allPatients[3].id,
      therapistId: allTherapists[0].id,
      appointmentDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10:00 mañana
      duration: 30,
      status: 'SCHEDULED' as const,
    },
    {
      patientId: allPatients[4].id,
      therapistId: allTherapists[1].id,
      appointmentDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 14:00 mañana
      duration: 60,
      status: 'CONFIRMED' as const,
    },
    // Citas para pasado mañana
    {
      patientId: allPatients[5].id,
      therapistId: allTherapists[2].id,
      appointmentDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 08:00 pasado mañana
      duration: 60,
      status: 'SCHEDULED' as const,
    },
    {
      patientId: allPatients[6].id,
      therapistId: allTherapists[0].id,
      appointmentDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), // 16:00 pasado mañana
      duration: 45,
      status: 'SCHEDULED' as const,
    },
    // Citas para la próxima semana
    {
      patientId: allPatients[7].id,
      therapistId: allTherapists[1].id,
      appointmentDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 09:00 próxima semana
      duration: 60,
      status: 'SCHEDULED' as const,
    },
    {
      patientId: allPatients[8].id,
      therapistId: allTherapists[2].id,
      appointmentDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 13:00 próxima semana
      duration: 90,
      status: 'CONFIRMED' as const,
    },
    // Citas pasadas (completadas)
    {
      patientId: allPatients[0].id,
      therapistId: allTherapists[0].id,
      appointmentDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10:00 hace 2 días
      duration: 60,
      status: 'COMPLETED' as const,
    },
    {
      patientId: allPatients[1].id,
      therapistId: allTherapists[1].id,
      appointmentDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 14:00 hace 5 días
      duration: 45,
      status: 'COMPLETED' as const,
    },
    // Cita cancelada
    {
      patientId: allPatients[2].id,
      therapistId: allTherapists[0].id,
      appointmentDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 11:00 en 3 días
      duration: 60,
      status: 'CANCELLED' as const,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const appointmentData of appointmentsData) {
    try {
      // Verificar que no haya conflicto de horario
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          therapistId: appointmentData.therapistId,
          appointmentDate: {
            gte: new Date(appointmentData.appointmentDate.getTime() - appointmentData.duration * 60000),
            lte: new Date(appointmentData.appointmentDate.getTime() + appointmentData.duration * 60000),
          },
          status: {
            notIn: ['CANCELLED', 'NO_SHOW'],
          },
        },
      });

      if (existingAppointment) {
        skippedCount++;
        continue;
      }

      await prisma.appointment.create({
        data: appointmentData,
      });

      createdCount++;
    } catch (error: any) {
      console.error(`❌ Error al crear cita:`, error.message);
      skippedCount++;
    }
  }

  console.log(`✅ ${createdCount} citas creadas, ${skippedCount} omitidas (conflictos o errores)`);

  // Crear sesiones de tratamiento
  console.log(`💼 Creando sesiones de tratamiento...`);
  
  const completedAppointments = await prisma.appointment.findMany({
    where: { status: 'COMPLETED' },
    take: 5,
  });

  const sessionsData = [];
  for (let i = 0; i < completedAppointments.length; i++) {
    const appointment = completedAppointments[i];
    const sessionDate = new Date(appointment.appointmentDate);
    
    sessionsData.push({
      patientId: appointment.patientId,
      therapistId: appointment.therapistId,
      appointmentId: appointment.id,
      sessionDate: sessionDate,
      duration: appointment.duration,
      interventions: [
        'Ejercicios de fortalecimiento',
        'Estiramientos pasivos',
        'Terapia manual',
        'Aplicación de calor',
        'Electroterapia',
      ][i % 5],
      progress: [
        'Paciente muestra mejoría en rango de movimiento',
        'Dolor reducido significativamente',
        'Fuerza muscular aumentada',
        'Movilidad mejorada',
        'Paciente muy colaborativo',
      ][i % 5],
      painLevel: [7, 5, 6, 4, 5][i % 5],
      notes: [
        'Sesión muy productiva, paciente respondió bien al tratamiento',
        'Continuar con ejercicios en casa',
        'Progreso notable desde la última sesión',
        'Paciente reporta menos dolor',
        'Recomendar ejercicios de mantenimiento',
      ][i % 5],
    });
  }

  // Crear sesiones adicionales sin cita asociada
  for (let i = 0; i < 3; i++) {
    const patient = allPatients[i % allPatients.length];
    const therapist = allTherapists[i % allTherapists.length];
    const sessionDate = new Date(today.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    sessionDate.setHours(10 + i, 0, 0, 0);

    sessionsData.push({
      patientId: patient.id,
      therapistId: therapist.id,
      appointmentId: null,
      sessionDate: sessionDate,
      duration: 60,
      interventions: 'Terapia combinada: ejercicios + masaje',
      progress: `Sesión ${i + 1} completada con éxito`,
      painLevel: [8, 6, 5][i],
      notes: 'Sesión independiente, no asociada a cita',
    });
  }

  let sessionsCreated = 0;
  for (const sessionData of sessionsData) {
    try {
      await prisma.treatmentSession.create({
        data: sessionData,
      });
      sessionsCreated++;
    } catch (error: any) {
      console.error(`❌ Error al crear sesión:`, error.message);
    }
  }
  console.log(`✅ ${sessionsCreated} sesiones de tratamiento creadas`);

  // Crear evaluaciones
  console.log(`📊 Creando evaluaciones...`);
  
  const evaluationsData = [];
  
  // Evaluaciones iniciales para más pacientes (aumentar a 8)
  for (let i = 0; i < Math.min(8, allPatients.length); i++) {
    const patient = allPatients[i];
    const evalDate = new Date(today.getTime() - (30 + i * 7) * 24 * 60 * 60 * 1000);
    
    evaluationsData.push({
      patientId: patient.id,
      evaluationType: 'INITIAL' as const,
      evaluationDate: evalDate,
      rangeOfMotion: [
        'Flexión: 90°, Extensión: 0°, Rotación interna: 45°, Rotación externa: 30°',
        'Flexión: 120°, Extensión: -10°, Rotación: Limitada',
        'Flexión: 100°, Extensión: 5°, Rotación completa',
        'Flexión: 80°, Extensión: 0°, Rotación limitada a 20°',
        'Flexión: 110°, Extensión: -5°, Rotación normal',
        'Flexión: 95°, Extensión: 0°, Rotación interna: 40°, Rotación externa: 25°',
        'Flexión: 105°, Extensión: -3°, Rotación limitada',
        'Flexión: 85°, Extensión: 2°, Rotación normal',
      ][i],
      strength: [
        'Fuerza muscular 3/5, Resistencia baja',
        'Fuerza muscular 4/5, Resistencia moderada',
        'Fuerza muscular 2/5, Requiere fortalecimiento',
        'Fuerza muscular 4/5, Buena resistencia',
        'Fuerza muscular 3/5, Resistencia mejorable',
        'Fuerza muscular 3/5, Resistencia baja',
        'Fuerza muscular 4/5, Resistencia moderada',
        'Fuerza muscular 3/5, Requiere fortalecimiento',
      ][i],
      painLevel: [8, 7, 9, 6, 8, 7, 9, 6][i],
      functionalAssessment: [
        'Limitación funcional significativa, dificultad para actividades diarias',
        'Dificultad moderada en movimientos complejos',
        'Limitación severa, requiere asistencia',
        'Dificultad leve, puede realizar actividades básicas',
        'Limitación moderada, afecta actividades laborales',
        'Limitación funcional moderada, dificultad en movimientos',
        'Limitación severa, requiere apoyo',
        'Dificultad leve, puede realizar actividades básicas',
      ][i],
      notes: [
        'Evaluación inicial completa, paciente presenta dolor agudo',
        'Paciente muy motivado, buen pronóstico',
        'Requiere tratamiento intensivo',
        'Evaluación inicial, plan de tratamiento a definir',
        'Paciente colaborativo, expectativas realistas',
        'Evaluación inicial, requiere seguimiento',
        'Paciente con dolor crónico, necesita tratamiento',
        'Evaluación inicial, buen pronóstico',
      ][i],
    });
  }

  // Evaluaciones de progreso (aumentar a 5)
  for (let i = 0; i < Math.min(5, allPatients.length); i++) {
    const patient = allPatients[i];
    const evalDate = new Date(today.getTime() - (15 + i * 7) * 24 * 60 * 60 * 1000);
    
    evaluationsData.push({
      patientId: patient.id,
      evaluationType: 'PROGRESS' as const,
      evaluationDate: evalDate,
      rangeOfMotion: [
        'Flexión: 100°, Extensión: 0°, Rotación interna: 50°, Rotación externa: 35°',
        'Flexión: 130°, Extensión: -5°, Rotación mejorada',
        'Flexión: 110°, Extensión: 0°, Rotación mejorando',
        'Flexión: 105°, Extensión: -2°, Rotación interna: 55°, Rotación externa: 40°',
        'Flexión: 125°, Extensión: -3°, Rotación mejorada',
      ][i],
      strength: [
        'Fuerza muscular 4/5, Resistencia mejorada',
        'Fuerza muscular 4/5, Resistencia buena',
        'Fuerza muscular 3/5, Progreso notable',
        'Fuerza muscular 4/5, Resistencia mejorando',
        'Fuerza muscular 4/5, Buena resistencia',
      ][i],
      painLevel: [5, 4, 6, 5, 4][i],
      functionalAssessment: [
        'Mejora significativa, puede realizar más actividades',
        'Progreso excelente, casi sin limitaciones',
        'Mejora moderada, continúa el tratamiento',
        'Mejora notable, puede realizar actividades diarias',
        'Progreso bueno, reducción de limitaciones',
      ][i],
      notes: [
        'Evaluación de progreso: mejoría notable desde evaluación inicial',
        'Paciente responde muy bien al tratamiento',
        'Continuar con el plan establecido',
        'Progreso satisfactorio, mantener tratamiento',
        'Mejora constante, buen pronóstico',
      ][i],
    });
  }

  // Evaluaciones finales (aumentar a 4)
  for (let i = 0; i < Math.min(4, allPatients.length); i++) {
    const patient = allPatients[i];
    const evalDate = new Date(today.getTime() - (3 + i) * 24 * 60 * 60 * 1000);
    
    evaluationsData.push({
      patientId: patient.id,
      evaluationType: 'FINAL' as const,
      evaluationDate: evalDate,
      rangeOfMotion: [
        'Flexión: 120°, Extensión: -5°, Rotación interna: 60°, Rotación externa: 45°',
        'Flexión: 140°, Extensión: -10°, Rotación completa',
        'Flexión: 130°, Extensión: -8°, Rotación interna: 65°, Rotación externa: 50°',
        'Flexión: 135°, Extensión: -7°, Rotación completa',
      ][i],
      strength: [
        'Fuerza muscular 5/5, Resistencia excelente',
        'Fuerza muscular 5/5, Resistencia óptima',
        'Fuerza muscular 5/5, Resistencia excelente',
        'Fuerza muscular 5/5, Resistencia óptima',
      ][i],
      painLevel: [2, 1, 2, 1][i],
      functionalAssessment: [
        'Funcionalidad restaurada, puede realizar todas las actividades',
        'Recuperación completa, alta satisfactoria',
        'Funcionalidad completa restaurada',
        'Recuperación total, alta médica',
      ][i],
      notes: [
        'Evaluación final: tratamiento exitoso, paciente recuperado',
        'Alta médica, paciente completamente recuperado',
        'Tratamiento completado con éxito',
        'Alta satisfactoria, paciente recuperado',
      ][i],
    });
  }

  let evaluationsCreated = 0;
  let evaluationsSkipped = 0;
  for (const evalData of evaluationsData) {
    try {
      // Verificar si ya existe una evaluación similar para evitar duplicados exactos
      const existing = await prisma.evaluation.findFirst({
        where: {
          patientId: evalData.patientId,
          evaluationType: evalData.evaluationType,
          evaluationDate: {
            gte: new Date(evalData.evaluationDate.getTime() - 24 * 60 * 60 * 1000),
            lte: new Date(evalData.evaluationDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existing) {
        evaluationsSkipped++;
        continue;
      }

      await prisma.evaluation.create({
        data: evalData,
      });
      evaluationsCreated++;
    } catch (error: any) {
      console.error(`❌ Error al crear evaluación:`, error.message);
      evaluationsSkipped++;
    }
  }
  console.log(`✅ ${evaluationsCreated} evaluaciones creadas${evaluationsSkipped > 0 ? `, ${evaluationsSkipped} omitidas (duplicados)` : ''}`);

  // Crear planes de tratamiento (aumentar a 6)
  console.log(`📋 Creando planes de tratamiento...`);
  
  const plansData = [];
  
  for (let i = 0; i < Math.min(6, allPatients.length); i++) {
    const patient = allPatients[i];
    const sessionsCompleted = [0, 3, 8, 10, 5, 2][i];
    const sessionsPlanned = [10, 12, 10, 10, 15, 8][i];
    
    let status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    if (sessionsCompleted === 0) {
      status = i === 0 ? 'DRAFT' : i === 4 ? 'PENDING_APPROVAL' : 'APPROVED';
    } else if (sessionsCompleted >= sessionsPlanned) {
      status = 'COMPLETED';
    } else {
      status = 'IN_PROGRESS';
    }

    plansData.push({
      patientId: patient.id,
      title: [
        'Plan de Rehabilitación Post-Quirúrgica',
        'Plan de Tratamiento para Dolor Lumbar',
        'Plan de Fortalecimiento Muscular',
        'Plan de Recuperación Completa',
        'Plan de Terapia Intensiva',
        'Plan de Rehabilitación Funcional',
      ][i],
      description: [
        'Plan integral de rehabilitación después de cirugía de rodilla',
        'Tratamiento enfocado en reducir dolor y mejorar movilidad',
        'Programa de fortalecimiento para recuperación funcional',
        'Plan completo de recuperación con seguimiento regular',
        'Tratamiento intensivo para recuperación acelerada',
        'Programa de rehabilitación funcional personalizado',
      ][i],
      diagnosis: [
        'Lesión de rodilla post-quirúrgica',
        'Dolor lumbar crónico',
        'Debilidad muscular generalizada',
        'Recuperación post-traumática',
        'Lesión deportiva severa',
        'Disfunción musculoesquelética',
      ][i],
      goals: [
        'Restaurar rango de movimiento completo',
        'Reducir dolor a menos de 3/10',
        'Aumentar fuerza muscular a 5/5',
        'Recuperación funcional completa',
        'Recuperación completa en tiempo récord',
        'Mejorar funcionalidad y calidad de vida',
      ][i],
      sessionsPlanned: sessionsPlanned,
      sessionsCompleted: sessionsCompleted,
      totalCost: [500.00, 600.00, 500.00, 500.00, 750.00, 400.00][i],
      status: status,
      approvedByPatient: status !== 'DRAFT' && status !== 'PENDING_APPROVAL',
      approvedAt: status !== 'DRAFT' && status !== 'PENDING_APPROVAL' ? new Date(today.getTime() - (30 - i * 7) * 24 * 60 * 60 * 1000) : null,
    });
  }

  let plansCreated = 0;
  let plansSkipped = 0;
  for (const planData of plansData) {
    try {
      // Verificar si ya existe un plan similar para este paciente
      const existing = await prisma.treatmentPlan.findFirst({
        where: {
          patientId: planData.patientId,
          title: planData.title,
        },
      });

      if (existing) {
        plansSkipped++;
        continue;
      }

      await prisma.treatmentPlan.create({
        data: planData,
      });
      plansCreated++;
    } catch (error: any) {
      console.error(`❌ Error al crear plan de tratamiento:`, error.message);
      plansSkipped++;
    }
  }
  console.log(`✅ ${plansCreated} planes de tratamiento creados${plansSkipped > 0 ? `, ${plansSkipped} omitidos (duplicados)` : ''}`);

  // Crear algunos documentos médicos
  console.log(`📄 Creando documentos médicos...`);
  
  const documentsData = [];
  
  for (let i = 0; i < 3; i++) {
    const patient = allPatients[i];
    const docTypes = ['Radiografía', 'Resonancia Magnética', 'Análisis de Sangre'];
    const fileTypes = ['image/jpeg', 'application/pdf', 'application/pdf'];
    
    documentsData.push({
      patientId: patient.id,
      fileName: `${docTypes[i]} - ${patient.name}.pdf`,
      fileUrl: `https://example.com/documents/${patient.id}/${i + 1}.pdf`,
      fileType: fileTypes[i],
      description: [
        'Radiografía de rodilla - Vista lateral y frontal',
        'Resonancia magnética de columna lumbar',
        'Análisis completo de sangre - Perfil metabólico',
      ][i],
      uploadedAt: new Date(today.getTime() - (10 - i * 3) * 24 * 60 * 60 * 1000),
    });
  }

  let documentsCreated = 0;
  for (const docData of documentsData) {
    try {
      await prisma.medicalDocument.create({
        data: docData,
      });
      documentsCreated++;
    } catch (error: any) {
      console.error(`❌ Error al crear documento:`, error.message);
    }
  }
  console.log(`✅ ${documentsCreated} documentos médicos creados`);

  // Crear prescripciones de ejemplo
  console.log('💊 Creando prescripciones de ejemplo...');
  const prescriptionsData = [
    {
      patientId: allPatients[0].id, // María González
      therapistId: allTherapists[0].id, // Dr. Carlos Méndez
      prescriptionDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      diagnosis: 'Dolor lumbar crónico, contractura muscular',
      medications: JSON.stringify([
        {
          name: 'Ibuprofeno',
          dosage: '400mg',
          frequency: 'Cada 8 horas',
          duration: '7 días',
          instructions: 'Tomar con alimentos para evitar molestias gástricas',
        },
        {
          name: 'Relajante muscular',
          dosage: '10mg',
          frequency: 'Antes de dormir',
          duration: '5 días',
          instructions: 'Puede causar somnolencia, evitar conducir',
        },
      ]),
      instructions: 'Aplicar calor local 3 veces al día durante 15 minutos. Evitar esfuerzos físicos intensos.',
      notes: 'Paciente refiere mejoría con tratamiento previo. Seguir con ejercicios de estiramiento.',
    },
    {
      patientId: allPatients[1].id, // Juan Pérez
      therapistId: allTherapists[1].id, // Dra. Ana Martínez
      prescriptionDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      diagnosis: 'Lesión de rodilla, tendinitis',
      medications: JSON.stringify([
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Cada 6 horas',
          duration: '5 días',
          instructions: 'Solo si hay dolor',
        },
        {
          name: 'Gel antiinflamatorio',
          dosage: 'Aplicar capa fina',
          frequency: '3 veces al día',
          duration: '10 días',
          instructions: 'Aplicar sobre la zona afectada con masaje suave',
        },
      ]),
      instructions: 'Reposo relativo. Aplicar hielo después de ejercicios. Continuar con fisioterapia.',
      notes: 'Paciente deportista, requiere precaución con actividad física.',
    },
    {
      patientId: allPatients[2].id, // Carmen Rodríguez
      therapistId: allTherapists[0].id, // Dr. Carlos Méndez
      prescriptionDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      diagnosis: 'Artritis reumatoide, dolor articular',
      medications: JSON.stringify([
        {
          name: 'Metotrexato',
          dosage: '15mg',
          frequency: 'Una vez por semana',
          duration: 'Continuo',
          instructions: 'Tomar con ácido fólico. Monitorear función hepática',
        },
        {
          name: 'Ácido fólico',
          dosage: '5mg',
          frequency: 'Diario',
          duration: 'Continuo',
          instructions: 'Tomar el día después de metotrexato',
        },
        {
          name: 'Analgésico',
          dosage: '500mg',
          frequency: 'Según necesidad',
          duration: 'Según necesidad',
          instructions: 'Máximo 3 veces al día',
        },
      ]),
      instructions: 'Seguir dieta antiinflamatoria. Ejercicios de bajo impacto recomendados.',
      notes: 'Paciente con condiciones crónicas. Coordinar con reumatólogo.',
    },
    {
      patientId: allPatients[3].id, // Luis Martínez
      therapistId: allTherapists[2].id, // Lic. Roberto Silva
      prescriptionDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      diagnosis: 'Fractura de brazo en recuperación, rigidez articular',
      medications: JSON.stringify([
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Cada 8 horas',
          duration: '5 días',
          instructions: 'Para control del dolor',
        },
      ]),
      instructions: 'Continuar con ejercicios de movilización pasiva y activa. Aplicar calor antes de ejercicios.',
      notes: 'Paciente joven, buena evolución. Motivar a continuar con rehabilitación.',
    },
    {
      patientId: allPatients[4].id, // Ana López
      therapistId: allTherapists[1].id, // Dra. Ana Martínez
      prescriptionDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      diagnosis: 'Dolor crónico de espalda, postura incorrecta',
      medications: JSON.stringify([
        {
          name: 'Relajante muscular',
          dosage: '10mg',
          frequency: 'Antes de dormir',
          duration: '7 días',
          instructions: 'Puede causar somnolencia',
        },
        {
          name: 'Analgésico tópico',
          dosage: 'Aplicar según necesidad',
          frequency: '2-3 veces al día',
          duration: '10 días',
          instructions: 'Aplicar en zona lumbar con masaje',
        },
      ]),
      instructions: 'Corregir postura en el trabajo. Ejercicios de fortalecimiento de core. Evitar estar sentado por períodos prolongados.',
      notes: 'Paciente de oficina. Recomendar pausas activas cada hora.',
    },
  ];

  let prescriptionsCreated = 0;
  for (const prescriptionData of prescriptionsData) {
    try {
      await prisma.prescription.create({
        data: prescriptionData,
      });
      prescriptionsCreated++;
    } catch (error: any) {
      console.error(`❌ Error al crear prescripción:`, error.message);
    }
  }
  console.log(`✅ ${prescriptionsCreated} prescripciones creadas`);

  console.log('✨ Seed completado exitosamente!');
  console.log('\n📊 Resumen:');
  console.log(`   - Pacientes: ${allPatients.length}`);
  console.log(`   - Terapeutas: ${allTherapists.length}`);
  console.log(`   - Citas: ${createdCount}`);
  console.log(`   - Sesiones: ${sessionsCreated}`);
  console.log(`   - Evaluaciones: ${evaluationsCreated}`);
  console.log(`   - Planes de Tratamiento: ${plansCreated}`);
  console.log(`   - Documentos: ${documentsCreated}`);
  console.log(`   - Prescripciones: ${prescriptionsCreated}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

