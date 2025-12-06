export interface CreatePatientData {
  email?: string | null;
  name: string;
  phone: string;
  dui?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
}

export interface UpdatePatientData {
  email?: string | null;
  name?: string;
  phone?: string;
  dui?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
}

