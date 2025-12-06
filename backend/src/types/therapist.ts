export interface Therapist {
  id: string;
  email: string;
  name: string;
  phone: string;
  specialization?: string | null;
  createdAt: string;
  updatedAt: string;
  availability?: TherapistAvailability[];
  _count?: {
    appointments: number;
    sessions: number;
  };
}

export interface TherapistAvailability {
  id: string;
  therapistId: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, etc.
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
}

export interface CreateTherapistData {
  email: string;
  name: string;
  phone: string;
  specialization?: string | null;
}

export interface UpdateTherapistData extends Partial<CreateTherapistData> {}

export interface CreateAvailabilityData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface UpdateAvailabilityData extends Partial<CreateAvailabilityData> {}

