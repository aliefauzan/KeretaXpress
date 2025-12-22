import express from 'express';
import MaintenanceController from '../controllers/maintenanceController.js';
import { adminAuthMiddleware } from '../middlerware/adminMiddleware.js';

const router = express.Router();

// All maintenance routes require admin authentication
router.use(adminAuthMiddleware);

// Get all maintenance schedules
router.get('/', MaintenanceController.getAllMaintenance);

// Get active maintenance schedules (ongoing today)
router.get('/active', MaintenanceController.getActiveMaintenance);

// Check for booking conflicts
router.get('/check-conflicts', MaintenanceController.checkConflicts);

// Get maintenance schedules for a specific train
router.get('/train/:trainId', MaintenanceController.getTrainMaintenance);

// Create new maintenance schedule
router.post('/', MaintenanceController.createMaintenance);

// Update maintenance schedule
router.put('/:id', MaintenanceController.updateMaintenance);

// End maintenance early
router.patch('/:id/end', MaintenanceController.endMaintenanceEarly);

// Delete maintenance schedule
router.delete('/:id', MaintenanceController.deleteMaintenance);

export default router;
