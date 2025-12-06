import { Router } from 'express';
import * as prescriptionController from '../controllers/prescriptionController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createPrescriptionSchema, updatePrescriptionSchema } from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de recetas
router.post(
  '/',
  validate(createPrescriptionSchema),
  prescriptionController.createPrescription
);
router.get('/', prescriptionController.getPrescriptions);
router.get('/:id', prescriptionController.getPrescriptionById);
router.put(
  '/:id',
  validate(updatePrescriptionSchema),
  prescriptionController.updatePrescription
);
router.delete('/:id', prescriptionController.deletePrescription);
router.post('/:id/print', prescriptionController.markAsPrinted);

export default router;

