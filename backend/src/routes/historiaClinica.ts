import { Router } from 'express';
import * as ctrl from '../controllers/historiaClinicaController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();
router.use(authenticate);

router.get('/',                     ctrl.getAll);
router.get('/patient/:patientId',   ctrl.getByPatientId);
router.get('/:id',                  ctrl.getById);
router.post('/',                    ctrl.create);
router.put('/:id',                  ctrl.update);
router.delete('/:id',               ctrl.remove);

export default router;
