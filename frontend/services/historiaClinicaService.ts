import api from './api';

export interface AntecedentItem {
  tiene: boolean;
  especifique: string;
}

export interface EvaluacionFisicaSummary {
  id: string;
  tipo?: string | null;
  fechaEvaluacion: string;
  escalaDolor?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface HistoriaClinica {
  id: string;
  patientId: string;
  patient?: {
    id: string;
    name: string;
    gender?: string;
    birthDate?: string;
    photoUrl?: string;
    phone?: string;
  };
  // Baseline
  peso?: number;
  talla?: number;
  imc?: number;
  etnia?: string;
  // Motivo y antecedentes de tratamiento
  motivoConsulta?: string;
  tratamientosPrevios?: string;
  referidoPor?: string;
  // Antecedentes patológicos
  antecedentes?: Record<string, AntecedentItem>;
  // Hábitos de salud
  habitosSalud?: Record<string, AntecedentItem>;
  // Datos ginecológicos
  datosGinecologicos?: { embarazada: boolean | null; numHijos: number | null };
  // Evaluaciones físicas (lista resumida)
  evaluaciones?: EvaluacionFisicaSummary[];
  createdAt?: string;
  updatedAt?: string;
}

export const historiaClinicaService = {
  getAll: async (search?: string): Promise<HistoriaClinica[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await api.get(`/historia-clinica${params}`);
    return res.data.data;
  },

  getById: async (id: string): Promise<HistoriaClinica> => {
    const res = await api.get(`/historia-clinica/${id}`);
    return res.data.data;
  },

  getByPatientId: async (patientId: string): Promise<HistoriaClinica | null> => {
    try {
      const res = await api.get(`/historia-clinica/patient/${patientId}`);
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  create: async (data: Partial<HistoriaClinica>): Promise<HistoriaClinica> => {
    const res = await api.post('/historia-clinica', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<HistoriaClinica>): Promise<HistoriaClinica> => {
    const res = await api.put(`/historia-clinica/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/historia-clinica/${id}`);
  },
};
