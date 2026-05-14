import prisma from '../config/database';

export const getConfigs = async (category?: string) => {
  const where: any = {};

  if (category) {
    where.category = category;
  }

  const configs = await prisma.systemConfig.findMany({
    where,
    orderBy: { key: 'asc' },
  });

  return configs;
};

export const getConfigByKey = async (key: string) => {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!config) {
    throw new Error('Configuración no encontrada');
  }

  return config;
};

export const upsertConfig = async (
  key: string,
  value: string,
  description?: string,
  category?: string
) => {
  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: {
      value,
      description: description !== undefined ? description : undefined,
      category: category !== undefined ? category : undefined,
    },
    create: {
      key,
      value,
      description: description || null,
      category: category || 'general',
    },
  });

  return config;
};

export const deleteConfig = async (key: string) => {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!config) {
    throw new Error('Configuración no encontrada');
  }

  await prisma.systemConfig.delete({
    where: { key },
  });
};

export const initDefaultConfigs = async () => {
  const defaults = [
    {
      key: 'clinic_name',
      value: 'Mi Clínica',
      description: 'Nombre de la clínica',
      category: 'clinic',
    },
    {
      key: 'clinic_accent_color',
      value: 'indigo',
      description: 'Color de acento del sistema (indigo|violet|teal|emerald|rose|amber)',
      category: 'clinic',
    },
    {
      key: 'clinic_phone',
      value: '',
      description: 'Teléfono de la clínica',
      category: 'clinic',
    },
    {
      key: 'clinic_email',
      value: '',
      description: 'Email de la clínica',
      category: 'clinic',
    },
    {
      key: 'clinic_address',
      value: '',
      description: 'Dirección de la clínica',
      category: 'clinic',
    },
    {
      key: 'role_permissions',
      value: JSON.stringify({
        ADMIN:             { patients: true,  appointments: true,  treatments: true,  diagnoses: true,  expedientes: true,  evaluations: true,  prescriptions: true,  payments: true,  invoices: true,  reports: true,  config: true  },
        THERAPIST:         { patients: true,  appointments: true,  treatments: true,  diagnoses: true,  expedientes: true,  evaluations: true,  prescriptions: true,  payments: false, invoices: false, reports: false, config: false },
        RECEPCION:         { patients: true,  appointments: true,  treatments: false, diagnoses: false, expedientes: false, evaluations: false, prescriptions: false, payments: true,  invoices: false, reports: false, config: false },
        CONTABILIDAD:      { patients: false, appointments: false, treatments: false, diagnoses: false, expedientes: false, evaluations: false, prescriptions: false, payments: true,  invoices: true,  reports: true,  config: false },
        SUPERVISOR:        { patients: true,  appointments: true,  treatments: true,  diagnoses: true,  expedientes: true,  evaluations: true,  prescriptions: true,  payments: true,  invoices: true,  reports: true,  config: false },
        EXTERNAL_THERAPIST:{ patients: true,  appointments: true,  treatments: true,  diagnoses: false, expedientes: false, evaluations: true,  prescriptions: false, payments: false, invoices: false, reports: false, config: false },
      }),
      description: 'Permisos de acceso por rol (JSON)',
      category: 'roles',
    },
    {
      key: 'therapy_types',
      value: JSON.stringify([
        'Fisioterapia General',
        'Rehabilitación Lumbar',
        'Rehabilitación de Hombro',
        'Rehabilitación de Rodilla',
        'Rehabilitación de Cadera/Pelvis',
        'Terapia Deportiva',
        'Electroterapia',
        'Ultrasonido Terapéutico',
        'Masoterapia',
        'Hidroterapia',
        'Movilización Manual',
        'Estiramiento y Flexibilidad',
        'Fortalecimiento Muscular',
        'Drenaje Linfático',
        'Vendaje Neuromuscular (Kinesiotape)',
        'Ejercicio Terapéutico',
        'Reentrenamiento de Marcha',
        'Equilibrio y Coordinación',
        'Neurorehabilitación',
        'Liberación Miofascial',
        'RPG (Reeducación Postural Global)',
        'Pilates Terapéutico',
        'Rehabilitación Post-Operatoria',
        'Rehabilitación Pediátrica',
        'Fisioterapia Oncológica',
        'Terapia Vestibular (Vértigo/Mareos)',
        'Punción Seca',
      ]),
      description: 'Tipos de terapia disponibles',
      category: 'therapy_types',
    },
    {
      key: 'default_session_duration',
      value: '60',
      description: 'Duración predeterminada de sesión en minutos',
      category: 'session_durations',
    },
    {
      key: 'morning_shift_start',
      value: '07:00',
      description: 'Hora de inicio del turno mañana',
      category: 'schedules',
    },
    {
      key: 'morning_shift_end',
      value: '12:00',
      description: 'Hora de fin del turno mañana',
      category: 'schedules',
    },
    {
      key: 'afternoon_shift_start',
      value: '12:00',
      description: 'Hora de inicio del turno tarde',
      category: 'schedules',
    },
    {
      key: 'afternoon_shift_end',
      value: '17:00',
      description: 'Hora de fin del turno tarde',
      category: 'schedules',
    },
    {
      key: 'morning_therapists_count',
      value: '2',
      description: 'Número de fisioterapeutas en turno mañana',
      category: 'schedules',
    },
    {
      key: 'afternoon_therapists_count',
      value: '1',
      description: 'Número de fisioterapeutas en turno tarde',
      category: 'schedules',
    },
  ];

  const results = await Promise.all(
    defaults.map((item) =>
      prisma.systemConfig.upsert({
        where: { key: item.key },
        update: {},
        create: {
          key: item.key,
          value: item.value,
          description: item.description,
          category: item.category,
        },
      })
    )
  );

  return results;
};
