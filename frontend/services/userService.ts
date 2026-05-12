import api from './api';

export type UserRole = 'ADMIN' | 'THERAPIST' | 'RECEPCION' | 'CONTABILIDAD' | 'SUPERVISOR' | 'EXTERNAL_THERAPIST';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  therapistId: string | null;
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  specialization?: string;
}

export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  password?: string;
}

export const userService = {
  getAll: async (): Promise<AppUser[]> => {
    const res = await api.get<{ success: boolean; data: AppUser[] }>('/users');
    return res.data.data;
  },

  create: async (data: CreateUserData): Promise<AppUser> => {
    const res = await api.post<{ success: boolean; data: AppUser }>('/users', data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateUserData): Promise<AppUser> => {
    const res = await api.put<{ success: boolean; data: AppUser }>(`/users/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
