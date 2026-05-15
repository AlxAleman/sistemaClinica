import api from './api';

export interface EpisodeEvaluacion {
  id: string;
  tipo: string | null;
  fechaEvaluacion: string;
  escalaDolor: number | null;
}

export interface EpisodeDiagnosis {
  id: string;
  clinicalDiagnosis: string;
  diagnosisDate: string;
  status: string;
  observations: string | null;
  _count: { treatmentPlans: number };
}

export interface EpisodePlan {
  id: string;
  title: string;
  status: string;
  sessionsPlanned: number;
  sessionsCompleted: number;
  startDate: string | null;
}

export interface ConsultaEpisode {
  id: string;
  patientId: string;
  motivoConsulta: string;
  fecha: string;
  notas: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  evaluaciones: EpisodeEvaluacion[];
  diagnoses: EpisodeDiagnosis[];
  treatmentPlans: EpisodePlan[];
}

export const consultaEpisodeService = {
  getByPatient: async (patientId: string): Promise<ConsultaEpisode[]> => {
    const res = await api.get<{ success: boolean; data: ConsultaEpisode[] }>(
      `/episodes/patient/${patientId}`
    );
    return res.data.data;
  },

  create: async (data: {
    patientId: string;
    motivoConsulta: string;
    fecha?: string;
    notas?: string;
  }): Promise<ConsultaEpisode> => {
    const res = await api.post<{ success: boolean; data: ConsultaEpisode }>('/episodes', data);
    return res.data.data;
  },

  update: async (
    id: string,
    data: { motivoConsulta?: string; fecha?: string; notas?: string; isActive?: boolean }
  ): Promise<ConsultaEpisode> => {
    const res = await api.put<{ success: boolean; data: ConsultaEpisode }>(`/episodes/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/episodes/${id}`);
  },
};
