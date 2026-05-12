import { Router } from 'express';
import * as therapistNoteController from '../controllers/therapistNoteController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.use(authenticate);

router.post('/', therapistNoteController.createTherapistNote);
router.get('/patient/:patientId', therapistNoteController.getNotesByPatient);
router.delete('/:id', therapistNoteController.deleteTherapistNote);

export default router;
