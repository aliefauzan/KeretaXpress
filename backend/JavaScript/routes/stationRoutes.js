import express from 'express';
import StationController from '../controllers/stationController.js';

const router = express.Router();

// Public route - get all stations
router.get('/', StationController.index);
router.get('/:id', StationController.show);

// Admin route (if needed)
// router.post('/', authMiddleware, StationController.create);

export default router;
