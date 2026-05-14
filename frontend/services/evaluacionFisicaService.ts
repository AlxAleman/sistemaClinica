import api from './api';

export interface MuscleEntry { di: string; dd: string; fi: string; fd: string }
export interface GonioEntry  { inicial: string; final: string }
export interface PosturalDI  { d: string; i: string }

export interface EvaluacionFisica {
  id: string;
  historiaClinicaId: string;
  patientId: string;
  tipo?: string | null;           // "inicial" | "progreso" | "seguimiento" | "final"
  fechaEvaluacion: string;

  peso?: number | null;
  talla?: number | null;
  imc?: number | null;

  signosVitales?: { ta: string; temperatura: string; pc: string; pb: string } | null;
  espasmos?: { tiene: boolean; sitio: string; caracteristicas: string } | null;
  diagnosticoRehabilitacion?: { reflejos: string; sensibilidad: string; lenguajeOrientacion: string; otros: string } | null;
  cicatrizQuirurgica?: string | null;
  traslados?: { velInicial: string; velFinal: string; observaciones: string } | null;
  marchaDeambulacion?: {
    libre: boolean; claudicante: boolean; conAyuda: boolean;
    espastica: boolean; ataxica: boolean; otros: boolean; observaciones: string;
  } | null;
  escalaDolor?: number | null;
  fuerzaMuscular?: {
    miembroSuperior: Record<string, MuscleEntry>;
    miembroInferior: Record<string, MuscleEntry>;
  } | null;
  goniometriaSuper?: {
    hombro: Record<string, GonioEntry>;
    codo: Record<string, GonioEntry>;
    antebrazo: Record<string, GonioEntry>;
    muneca: Record<string, GonioEntry>;
  } | null;
  goniometriaInfer?: {
    cadera: Record<string, GonioEntry>;
    rodilla: Record<string, GonioEntry>;
    tobillo: Record<string, GonioEntry>;
  } | null;
  valoracionPostural?: {
    vistaAnterior: Record<string, Record<string, PosturalDI>>;
    vistaLateral: Record<string, Record<string, PosturalDI | string>>;
    vistaPosterior: Record<string, Record<string, PosturalDI>>;
  } | null;
  columna?: { planoSagital: string; planoFrontal: string } | null;

  creadoPor?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const evaluacionFisicaService = {
  getByHistoria: async (historiaClinicaId: string): Promise<EvaluacionFisica[]> => {
    const res = await api.get(`/evaluacion-fisica/historia/${historiaClinicaId}`);
    return res.data.data;
  },

  getByPatient: async (patientId: string): Promise<EvaluacionFisica[]> => {
    const res = await api.get(`/evaluacion-fisica/patient/${patientId}`);
    return res.data.data;
  },

  getById: async (id: string): Promise<EvaluacionFisica> => {
    const res = await api.get(`/evaluacion-fisica/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<EvaluacionFisica>): Promise<EvaluacionFisica> => {
    const res = await api.post('/evaluacion-fisica', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<EvaluacionFisica>): Promise<EvaluacionFisica> => {
    const res = await api.put(`/evaluacion-fisica/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/evaluacion-fisica/${id}`);
  },
};
