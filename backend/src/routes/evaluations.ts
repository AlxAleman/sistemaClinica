import { Router } from 'express';
import * as evaluationController from '../controllers/evaluationController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createEvaluationSchema, updateEvaluationSchema } from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de evaluaciones
router.post(
  '/',
  validate(createEvaluationSchema),
  evaluationController.createEvaluation
);
router.get('/', evaluationController.getEvaluations);
router.get('/:id', evaluationController.getEvaluationById);
router.put(
  '/:id',
  validate(updateEvaluationSchema),
  evaluationController.updateEvaluation
);
router.delete('/:id', evaluationController.deleteEvaluation);

// Ruta especial para comparación
router.get('/patients/:patientId/comparison', evaluationController.getEvaluationComparison);

export default router;

