import { Router } from 'express';
import * as therapistController from '../controllers/therapistController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createTherapistSchema,
  updateTherapistSchema,
  createAvailabilitySchema,
  updateAvailabilitySchema,
} from '../utils/validators';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de terapeutas
router.post(
  '/',
  validate(createTherapistSchema),
  therapistController.createTherapist
);
router.get('/', therapistController.getTherapists);
router.get('/:id', therapistController.getTherapistById);
router.put(
  '/:id',
  validate(updateTherapistSchema),
  therapistController.updateTherapist
);
router.delete('/:id', therapistController.deleteTherapist);

// Rutas de disponibilidad
router.post(
  '/:id/availability',
  validate(createAvailabilitySchema),
  therapistController.createAvailability
);
router.get('/:id/availability', therapistController.getAvailability);
router.put(
  '/:id/availability/:availabilityId',
  validate(updateAvailabilitySchema),
  therapistController.updateAvailability
);
router.delete('/:id/availability/:availabilityId', therapistController.deleteAvailability);

export default router;

