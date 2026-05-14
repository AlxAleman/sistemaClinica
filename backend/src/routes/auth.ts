import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { loginSchema, registerSchema } from '../utils/validators';

const router: Router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);

export default router;

