import { Router } from 'express';
import * as treatmentPlanController from '../controllers/treatmentPlanController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createTreatmentPlanSchema, updateTreatmentPlanSchema } from '../utils/validators';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de planes de tratamiento
router.post(
  '/',
  validate(createTreatmentPlanSchema),
  treatmentPlanController.createTreatmentPlan
);
router.get('/', treatmentPlanController.getTreatmentPlans);
router.get('/:id', treatmentPlanController.getTreatmentPlanById);
router.put(
  '/:id',
  validate(updateTreatmentPlanSchema),
  treatmentPlanController.updateTreatmentPlan
);
router.delete('/:id', treatmentPlanController.deleteTreatmentPlan);
router.post('/:id/approve', treatmentPlanController.approveTreatmentPlan);

export default router;

