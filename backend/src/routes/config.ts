import { Router } from 'express';
import multer from 'multer';
import * as configController from '../controllers/configController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', configController.getConfigs);
router.post('/init', configController.initDefaultConfigs);
router.post('/logo', upload.single('logo'), configController.uploadClinicLogo);
router.get('/:key', configController.getConfigByKey);
router.put('/:key', configController.upsertConfig);
router.delete('/:key', configController.deleteConfig);

export default router;
