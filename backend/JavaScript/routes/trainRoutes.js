import express from 'express';
import TrainController from '../controllers/trainController.js';
import { searchTrainValidation } from '../utils/validators.js';
import authMiddleware from '../middlerware/authMiddleware.js';

const router = express.Router();

// Public route
router.get('/all', TrainController.allTrains);

// Protected routes
router.get('/search', authMiddleware, searchTrainValidation, TrainController.search);
router.get('/promo', authMiddleware, TrainController.getPromoTrains);
router.get('/:id', authMiddleware, TrainController.show);
router.get('/:id/available-seats', authMiddleware, TrainController.availableSeats);

export default router;
