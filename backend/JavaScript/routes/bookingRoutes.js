import express from 'express';
import BookingController from '../controllers/bookingController.js';
import { 
  createBookingValidation, 
  bookingHistoryValidation,
  updateBookingStatusValidation 
} from '../utils/validators.js';
import authMiddleware from '../middlerware/authMiddleware.js';

const router = express.Router();

// All booking routes are protected
router.post('/', authMiddleware, createBookingValidation, BookingController.book);
router.get('/history', authMiddleware, bookingHistoryValidation, BookingController.history);
router.put('/:transactionId/status', authMiddleware, updateBookingStatusValidation, BookingController.updateStatus);

export default router;
