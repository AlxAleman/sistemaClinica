import { CorsOptions } from 'cors';
import { env } from './env';

const ALLOWED_ORIGINS = [
  env.FRONTEND_URL,
  'https://sistema-clinica-alx.vercel.app',
].filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Sin origin (curl, Postman, server-to-server) → permitir
    if (!origin) return callback(null, true);

    // localhost en cualquier puerto → siempre permitir
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Previews de Vercel para este proyecto
    if (origin.match(/^https:\/\/sistema-clinica-alx.*\.vercel\.app$/)) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

