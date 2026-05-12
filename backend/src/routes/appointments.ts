import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  claimAppointmentSchema,
} from '../utils/validators';

const router: Router = Router();

router.use(authenticate);

router.post('/', validate(createAppointmentSchema), appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/calendar', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.put('/:id', validate(updateAppointmentSchema), appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);
router.post('/:id/confirm', appointmentController.confirmAppointment);
router.post(
  '/:id/claim',
  requireRole('THERAPIST', 'EXTERNAL_THERAPIST', 'ADMIN'),
  appointmentController.claimAppointment
);

export default router;
