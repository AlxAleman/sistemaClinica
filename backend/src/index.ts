import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import logger from './middleware/logger';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import therapistRoutes from './routes/therapists';
import appointmentRoutes from './routes/appointments';
import sessionRoutes from './routes/sessions';
import treatmentPlanRoutes from './routes/treatmentPlans';
import evaluationRoutes from './routes/evaluations';
import reportRoutes from './routes/reports';
import prescriptionRoutes from './routes/prescriptions';
import diagnosisRoutes from './routes/diagnoses';
import expedienteRoutes from './routes/expediente';
import therapistNoteRoutes from './routes/therapistNotes';
import configRoutes from './routes/config';
import paymentRoutes from './routes/payments';
import invoiceRoutes from './routes/invoices';
import historiaClinicaRoutes from './routes/historiaClinica';
import evaluacionFisicaRoutes from './routes/evaluacionFisica';
import userRoutes from './routes/users';
import { recalculateAllCounters } from './services/treatmentPlanService';
import { initDefaultConfigs } from './services/configService';

const app: Express = express();

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Aumentar límite para archivos base64
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Clínica de Fisioterapia',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      patients: '/api/patients',
      therapists: '/api/therapists',
      appointments: '/api/appointments',
      sessions: '/api/sessions',
      treatmentPlans: '/api/treatment-plans',
      evaluations: '/api/evaluations',
      reports: '/api/reports',
      prescriptions: '/api/prescriptions',
      diagnoses: '/api/diagnoses',
      expediente: '/api/expediente',
      therapistNotes: '/api/therapist-notes',
      config: '/api/config',
      payments: '/api/payments',
      invoices: '/api/invoices'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/treatment-plans', treatmentPlanRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/expediente', expedienteRoutes);
app.use('/api/therapist-notes', therapistNoteRoutes);
app.use('/api/config', configRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/historia-clinica', historiaClinicaRoutes);
app.use('/api/evaluacion-fisica', evaluacionFisicaRoutes);
app.use('/api/users', userRoutes);

// Error handler (debe ir al final)
app.use(errorHandler);

// Iniciar servidor (solo en desarrollo local)
if (require.main === module) {
  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
    logger.info(`📝 Ambiente: ${env.NODE_ENV}`);
    logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
    recalculateAllCounters()
      .then(() => logger.info('✅ Contadores de sesiones recalculados'))
      .catch(err => logger.error('Error recalculando contadores:', err));
    initDefaultConfigs()
      .then(() => logger.info('✅ Configuración por defecto inicializada'))
      .catch(err => logger.error('Error inicializando configuración:', err));
  });
}

// Export para Vercel Serverless Functions
export default app;

