import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.use(authenticate);

router.post('/', invoiceController.createInvoice);
router.get('/patient/:patientId', invoiceController.getInvoicesByPatient);
router.get('/payment/:paymentId', invoiceController.getInvoiceByPayment);
router.patch('/:id/status', invoiceController.updateInvoiceStatus);

export default router;
