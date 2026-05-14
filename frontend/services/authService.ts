import api from "./api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    mustChangePassword: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      "/auth/login",
      credentials
    );
    if (!response.data.success) {
      throw new Error("Error en el inicio de sesión");
    }
    return response.data.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      "/auth/register",
      data
    );
    if (!response.data.success) {
      throw new Error("Error en el registro");
    }
    return response.data.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await api.put<{ success: boolean; error?: string }>(
      '/auth/change-password',
      { currentPassword, newPassword }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al cambiar contraseña');
    }
  },

  logout: () => {
    // El logout se maneja en el store
  },
};

