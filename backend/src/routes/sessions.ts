import { Router } from 'express';
import * as sessionController from '../controllers/sessionController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createSessionSchema, updateSessionSchema, confirmAttendanceSchema } from '../utils/validators';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de sesiones
router.post(
  '/',
  validate(createSessionSchema),
  sessionController.createSession
);
router.get('/', sessionController.getSessions);
router.get('/:id', sessionController.getSessionById);
router.put(
  '/:id',
  validate(updateSessionSchema),
  sessionController.updateSession
);
router.delete('/:id', sessionController.deleteSession);
router.patch('/:id/attendance', validate(confirmAttendanceSchema), sessionController.confirmAttendance);
router.get('/check/conflicts', sessionController.detectConflicts);

export default router;

