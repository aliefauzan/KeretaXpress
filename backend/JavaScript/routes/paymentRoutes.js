import express from 'express';
import PaymentController from '../controllers/paymentController.js';
import authMiddleware from '../middlerware/authMiddleware.js';

const router = express.Router();

// Midtrans payment routes
router.post('/create', authMiddleware, PaymentController.createPayment);
router.post('/notification', PaymentController.handleNotification); // Webhook from Midtrans (no auth)
router.get('/status/:transaction_id', authMiddleware, PaymentController.checkStatus);

export default router;

