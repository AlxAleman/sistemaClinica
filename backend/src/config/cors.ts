import { CorsOptions } from 'cors';
import { env } from './env';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // En desarrollo, permitir localhost en cualquier puerto
    if (env.NODE_ENV === 'development') {
      if (!origin || origin.includes('localhost')) {
        return callback(null, true);
      }
    }
    
    // En producción, validar origen
    const allowedOrigins = [env.FRONTEND_URL];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

