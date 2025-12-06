import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de reportes
router.get('/dashboard', reportController.getDashboardKPIs);
router.get('/patients', reportController.getPatientReport);
router.get('/sessions', reportController.getSessionReport);
router.get('/clinical-progress', reportController.getClinicalProgressReport);
router.get('/export/:type', reportController.exportReport);

export default router;

