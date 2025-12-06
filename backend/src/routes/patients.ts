import { Router } from 'express';
import * as patientController from '../controllers/patientController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createPatientSchema,
  updatePatientSchema,
  medicalProfileSchema,
} from '../utils/validators';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de pacientes
router.post(
  '/',
  validate(createPatientSchema),
  patientController.createPatient
);
router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);
router.put(
  '/:id',
  validate(updatePatientSchema),
  patientController.updatePatient
);
router.delete('/:id', patientController.deletePatient);

// Rutas de perfil médico
router.post(
  '/:id/medical-profile',
  validate(medicalProfileSchema),
  patientController.createOrUpdateMedicalProfile
);

// Rutas de documentos médicos
router.post('/:id/documents', patientController.uploadMedicalDocument);

export default router;

