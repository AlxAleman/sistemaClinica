import { Router } from 'express';
import * as configController from '../controllers/configController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.use(authenticate);

router.get('/', configController.getConfigs);
router.post('/init', configController.initDefaultConfigs);
router.get('/:key', configController.getConfigByKey);
router.put('/:key', configController.upsertConfig);
router.delete('/:key', configController.deleteConfig);

export default router;
