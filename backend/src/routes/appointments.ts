import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from '../utils/validators';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de citas
router.post(
  '/',
  validate(createAppointmentSchema),
  appointmentController.createAppointment
);
router.get('/', appointmentController.getAppointments);
router.get('/calendar', appointmentController.getAppointments); // Alias para vista calendario
router.get('/:id', appointmentController.getAppointmentById);
router.put(
  '/:id',
  validate(updateAppointmentSchema),
  appointmentController.updateAppointment
);
router.delete('/:id', appointmentController.deleteAppointment);
router.post('/:id/confirm', appointmentController.confirmAppointment);

export default router;

