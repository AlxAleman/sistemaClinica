import { Router } from 'express';
import * as ctrl from '../controllers/evaluacionFisicaController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();
router.use(authenticate);

router.get('/historia/:historiaClinicaId', ctrl.getByHistoria);
router.get('/patient/:patientId',          ctrl.getByPatient);
router.get('/:id',                         ctrl.getById);
router.post('/',                           ctrl.create);
router.put('/:id',                         ctrl.update);
router.delete('/:id',                      ctrl.remove);

export default router;
