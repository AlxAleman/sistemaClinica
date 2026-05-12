import api from './api';

export interface AntecedentItem {
  tiene: boolean;
  especifique: string;
}

export interface SignosVitales {
  ta: string;
  temperatura: string;
  pc: string;
  pb: string;
}

export interface MuscleEntry {
  di: string; // derecho inicial
  dd: string; // derecho final
  fi: string; // izquierdo inicial
  fd: string; // izquierdo final
}

export interface GonioEntry {
  inicial: string;
  final: string;
}

export interface PosturalDI {
  d: string;
  i: string;
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
  // Exploración física
  peso?: number;
  talla?: number;
  imc?: number;
  etnia?: string;
  // Consulta
  motivoConsulta?: string;
  tratamientosPrevios?: string;
  // JSON sections
  antecedentes?: Record<string, AntecedentItem>;
  signosVitales?: SignosVitales;
  espasmos?: { tiene: boolean; sitio: string; caracteristicas: string };
  habitosSalud?: Record<string, AntecedentItem>;
  datosGinecologicos?: { embarazada: boolean | null; numHijos: number | null };
  diagnosticoRehabilitacion?: { reflejos: string; sensibilidad: string; lenguajeOrientacion: string; otros: string };
  cicatrizQuirurgica?: string;
  traslados?: { velInicial: string; velFinal: string; observaciones: string };
  marchaDeambulacion?: {
    libre: boolean; claudicante: boolean; conAyuda: boolean;
    espastica: boolean; ataxica: boolean; otros: boolean; observaciones: string;
  };
  escalaDolor?: number;
  fuerzaMuscular?: {
    miembroSuperior: Record<string, MuscleEntry>;
    miembroInferior: Record<string, MuscleEntry>;
  };
  goniometriaSuper?: {
    hombro: Record<string, GonioEntry>;
    codo: Record<string, GonioEntry>;
    antebrazo: Record<string, GonioEntry>;
    muneca: Record<string, GonioEntry>;
  };
  goniometriaInfer?: {
    cadera: Record<string, GonioEntry>;
    rodilla: Record<string, GonioEntry>;
    tobillo: Record<string, GonioEntry>;
  };
  valoracionPostural?: {
    vistaAnterior: Record<string, Record<string, PosturalDI>>;
    vistaLateral: Record<string, Record<string, PosturalDI | string>>;
    vistaPosterior: Record<string, Record<string, PosturalDI>>;
  };
  columna?: { planoSagital: string; planoFrontal: string };
  fechaEvaluacion?: string;
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
