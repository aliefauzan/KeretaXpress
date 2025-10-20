import express from 'express';
import { body } from 'express-validator';
import { adminAuthMiddleware, checkAdminRole } from '../middlerware/adminMiddleware.js';
import AdminController from '../controllers/adminController.js';

const router = express.Router();

// ==================== TRAIN MANAGEMENT ROUTES ====================

// Create train (superadmin and manager only)
router.post('/trains',
  adminAuthMiddleware,
  checkAdminRole(['superadmin', 'manager']),
  [
    body('name').notEmpty().withMessage('Train name is required'),
    body('class_type').notEmpty().withMessage('Class type is required')
      .isIn(['economy', 'business', 'executive']).withMessage('Invalid class type'),
    body('available_seats').isInt({ min: 1 }).withMessage('Available seats must be at least 1'),
    body('departure_station_id').isInt().withMessage('Departure station ID must be an integer'),
    body('arrival_station_id').isInt().withMessage('Arrival station ID must be an integer'),
    body('departure_time').matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
      .withMessage('Departure time must be in HH:MM:SS format'),
    body('arrival_time').matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
      .withMessage('Arrival time must be in HH:MM:SS format'),
    body('price').isFloat({ min: 0, max: 9999999999.99 })
      .withMessage('Price must be between 0 and 9,999,999,999.99')
  ],
  AdminController.createTrain
);

// Get all trains (admin view with details)
router.get('/trains',
  adminAuthMiddleware,
  AdminController.getAllTrains
);

// Update train (superadmin and manager only)
router.put('/trains/:id',
  adminAuthMiddleware,
  checkAdminRole(['superadmin', 'manager']),
  AdminController.updateTrain
);

// Delete train (superadmin only)
router.delete('/trains/:id',
  adminAuthMiddleware,
  checkAdminRole('superadmin'),
  AdminController.deleteTrain
);

// ==================== BOOKING & PAYMENT MANAGEMENT ROUTES ====================

// Get all bookings (all admin roles)
router.get('/bookings',
  adminAuthMiddleware,
  AdminController.getAllBookings
);

// Get booking statistics (dashboard)
router.get('/bookings/statistics',
  adminAuthMiddleware,
  AdminController.getBookingStats
);

// Manual payment confirmation (superadmin and manager only)
router.post('/payments/:transaction_id/confirm',
  adminAuthMiddleware,
  checkAdminRole(['superadmin', 'manager']),
  [
    body('status').isIn(['paid', 'failed', 'cancelled']).withMessage('Status must be paid, failed, or cancelled'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  AdminController.confirmPayment
);

export default router;
