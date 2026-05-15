import { Router } from 'express';
import * as ctrl from '../controllers/consultaEpisodeController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();
router.use(authenticate);

router.post('/', ctrl.createEpisode);
router.get('/patient/:patientId', ctrl.getEpisodesByPatient);
router.get('/:id', ctrl.getEpisodeById);
router.put('/:id', ctrl.updateEpisode);
router.delete('/:id', ctrl.deleteEpisode);

export default router;
