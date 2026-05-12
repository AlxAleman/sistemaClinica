import { Router } from 'express';
import * as expedienteController from '../controllers/expedienteController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Ruta del expediente clínico (documento maestro del paciente)
router.get('/:patientId', expedienteController.getExpediente);

export default router;
