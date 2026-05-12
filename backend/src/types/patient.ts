export interface CreatePatientData {
  email?: string | null;
  name: string;
  phone: string;
  dui?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  address?: string | null;
  residence?: string | null;
  profession?: string | null;
  workplace?: string | null;
  insuranceCompany?: string | null;
  affiliateNumber?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  isActive?: boolean;
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
  residence?: string | null;
  profession?: string | null;
  workplace?: string | null;
  insuranceCompany?: string | null;
  affiliateNumber?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  isActive?: boolean;
}
