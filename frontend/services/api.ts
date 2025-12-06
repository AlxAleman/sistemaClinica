import axios from "axios";
import { useAuthStore } from "@/store/authStore";

// Debug: verificar que la variable se carga correctamente
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Log en desarrollo para debug
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API_URL configurada:', API_URL);
  console.log('NEXT_PUBLIC_API_URL desde env:', process.env.NEXT_PUBLIC_API_URL);
}

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos intentado refrescar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken, updateToken } = useAuthStore.getState();

        if (!refreshToken) {
          // No hay refresh token, redirigir a login
          useAuthStore.getState().logout();
          // Solo redirigir si no estamos ya en la página de login
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = "/login";
          }
          return Promise.reject(error);
        }

        // Intentar refrescar el token
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          { refreshToken }
        );

        const { accessToken: newAccessToken } = response.data.data;
        updateToken(newAccessToken);

        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Error al refrescar, hacer logout
        useAuthStore.getState().logout();
        // Solo redirigir si no estamos ya en la página de login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

