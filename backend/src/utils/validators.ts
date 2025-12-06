import { z } from 'zod';

// Validaciones de autenticación
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['ADMIN', 'THERAPIST', 'PATIENT']).optional(),
});

// Validaciones de pacientes
export const createPatientSchema = z.object({
  email: z.string().email('Email inválido').optional().nullable(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  dui: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  photoUrl: z.string().url('URL inválida').optional().nullable(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
});

export const updatePatientSchema = createPatientSchema.partial();

// Validaciones de perfil médico
export const medicalProfileSchema = z.object({
  allergies: z.string().optional().nullable(),
  medicalHistory: z.string().optional().nullable(),
  currentMedications: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Validaciones de terapeutas
export const createTherapistSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  specialization: z.string().optional().nullable(),
});

export const updateTherapistSchema = createTherapistSchema.partial();

// Validaciones de disponibilidad de terapeutas
export const createAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6, 'Día de la semana inválido (0-6)'),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  isAvailable: z.boolean().optional().default(true),
});

export const updateAvailabilitySchema = createAvailabilitySchema.partial();

// Validaciones de citas
export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'ID de paciente requerido'),
  therapistId: z.string().min(1, 'ID de terapeuta requerido'),
  appointmentDate: z.string().datetime('Fecha inválida'),
  duration: z.number().int().min(15).max(120).optional().default(60),
});

export const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
});

// Validaciones de sesiones de tratamiento
export const createSessionSchema = z.object({
  patientId: z.string().min(1, 'ID de paciente requerido'),
  therapistId: z.string().min(1, 'ID de terapeuta requerido'),
  appointmentId: z.string().optional().nullable(),
  sessionDate: z.string().datetime('Fecha inválida'),
  duration: z.number().int().min(15).max(120).optional().default(60),
  interventions: z.string().optional().nullable(),
  progress: z.string().optional().nullable(),
  painLevel: z.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateSessionSchema = createSessionSchema.partial();

// Validaciones de planes de tratamiento
export const createTreatmentPlanSchema = z.object({
  patientId: z.string().min(1, 'ID de paciente requerido'),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  goals: z.string().optional().nullable(),
  sessionsPlanned: z.number().int().min(1, 'Debe planificar al menos 1 sesión'),
  totalCost: z.number().positive('El costo debe ser positivo').optional().nullable(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional().default('DRAFT'),
});

export const updateTreatmentPlanSchema = createTreatmentPlanSchema.partial();

// Validaciones de evaluaciones
export const createEvaluationSchema = z.object({
  patientId: z.string().min(1, 'ID de paciente requerido'),
  evaluationType: z.enum(['INITIAL', 'PROGRESS', 'FINAL']),
  evaluationDate: z.string().datetime('Fecha inválida'),
  rangeOfMotion: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  painLevel: z.number().int().min(1).max(10).optional().nullable(),
  functionalAssessment: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateEvaluationSchema = createEvaluationSchema.partial();

// Validaciones de recetas médicas
const medicationSchema = z.object({
  name: z.string().min(1, 'Nombre del medicamento requerido'),
  dosage: z.string().min(1, 'Dosis requerida'),
  frequency: z.string().min(1, 'Frecuencia requerida'),
  duration: z.string().min(1, 'Duración requerida'),
  instructions: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'ID de paciente requerido'),
  therapistId: z.string().optional().nullable(),
  prescriptionDate: z.string().refine(
    (val) => {
      if (!val) return true; // Opcional
      // Acepta formato ISO datetime o datetime-local (YYYY-MM-DDTHH:mm)
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?Z?)?$/;
      return isoRegex.test(val);
    },
    { message: 'Fecha inválida. Use formato ISO datetime' }
  ).optional(),
  diagnosis: z.string().optional().nullable(),
  medications: z.array(medicationSchema).min(1, 'Debe incluir al menos un medicamento'),
  instructions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updatePrescriptionSchema = createPrescriptionSchema.partial();

