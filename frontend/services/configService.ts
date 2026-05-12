import api from './api';

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  category: string;
  updatedAt: string;
}

export const configService = {
  getAll: async (category?: string): Promise<SystemConfig[]> => {
    const response = await api.get<{ success: boolean; data: SystemConfig[] }>(
      '/config',
      { params: category ? { category } : undefined }
    );
    return response.data.data;
  },

  upsert: async (
    key: string,
    data: { value: string; description?: string; category?: string }
  ): Promise<SystemConfig> => {
    const response = await api.put<{ success: boolean; data: SystemConfig }>(
      `/config/${key}`,
      data
    );
    return response.data.data;
  },

  initDefaults: async (): Promise<void> => {
    await api.post('/config/init');
  },

  getTherapyTypes: async (): Promise<string[]> => {
    const configs = await configService.getAll('therapy_types');
    const config = configs.find((c) => c.key === 'therapy_types');
    if (!config) return [];
    try {
      return JSON.parse(config.value) as string[];
    } catch {
      return [];
    }
  },
};
