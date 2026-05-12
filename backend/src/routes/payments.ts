import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.use(authenticate);

router.post('/', paymentController.createPayment);
router.get('/', paymentController.getPayments);
router.get('/summary', paymentController.getPaymentSummary);
router.get('/patient/:patientId', paymentController.getPaymentsByPatient);
router.get('/:id', paymentController.getPaymentById);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);

export default router;
