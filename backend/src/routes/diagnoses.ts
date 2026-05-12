import { Router } from 'express';
import * as diagnosisController from '../controllers/diagnosisController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de diagnósticos
router.post('/', diagnosisController.createDiagnosis);
router.get('/patient/:patientId', diagnosisController.getDiagnosesByPatient);
router.get('/:id', diagnosisController.getDiagnosisById);
router.put('/:id', diagnosisController.updateDiagnosis);
router.delete('/:id', diagnosisController.deleteDiagnosis);

export default router;
