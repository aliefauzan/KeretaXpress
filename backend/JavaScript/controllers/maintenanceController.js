import Maintenance from '../models/Maintenance.js';
import Train from '../models/Train.js';
import { broadcastMaintenanceUpdate } from '../routes/maintenanceStreamRoutes.js';

class MaintenanceController {
  /**
   * Get all maintenance schedules
   */
  static async getAllMaintenance(req, res) {
    try {
      const maintenanceSchedules = await Maintenance.getAll();
      
      res.json({
        success: true,
        data: maintenanceSchedules
      });
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch maintenance schedules',
        error: error.message
      });
    }
  }

  /**
   * Get active maintenance schedules (ongoing today)
   */
  static async getActiveMaintenance(req, res) {
    try {
      const activeMaintenances = await Maintenance.getActiveMaintenance();
      
      res.json({
        success: true,
        data: activeMaintenances
      });
    } catch (error) {
      console.error('Error fetching active maintenances:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active maintenances',
        error: error.message
      });
    }
  }

  /**
   * Get maintenance schedules for a specific train
   */
  static async getTrainMaintenance(req, res) {
    try {
      const { trainId } = req.params;
      const maintenanceSchedules = await Maintenance.getByTrainId(trainId);
      
      res.json({
        success: true,
        data: maintenanceSchedules
      });
    } catch (error) {
      console.error('Error fetching train maintenance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch train maintenance',
        error: error.message
      });
    }
  }

  /**
   * Create a new maintenance schedule
   */
  static async createMaintenance(req, res) {
    try {
      const { trainId, startDate, endDate, reason } = req.body;
      const adminId = req.admin.id;

      // Validation
      if (!trainId || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Train ID, start date, and end date are required'
        });
      }

      // Check if train exists
      const train = await Train.findById(trainId);
      if (!train) {
        return res.status(404).json({
          success: false,
          message: 'Train not found'
        });
      }

      // Check for booking conflicts
      const conflicts = await Maintenance.checkBookingConflicts(trainId, startDate, endDate);
      
      if (conflicts.hasConflicts) {
        return res.status(409).json({
          success: false,
          message: `Cannot schedule maintenance. There are ${conflicts.conflictCount} existing bookings during this period.`,
          conflicts: {
            count: conflicts.conflictCount,
            dates: conflicts.datesWithBookings
          }
        });
      }

      // Create maintenance schedule
      const maintenance = await Maintenance.create({
        trainId,
        startDate,
        endDate,
        reason: reason || 'Scheduled maintenance',
        createdByAdminId: adminId
      });

      // Broadcast maintenance creation to all connected clients
      broadcastMaintenanceUpdate({
        type: 'maintenance_created',
        trainId,
        maintenance: {
          id: maintenance.id,
          trainId: maintenance.train_id,
          startDate: maintenance.start_date,
          endDate: maintenance.end_date,
          reason: maintenance.reason,
          status: maintenance.status
        }
      });

      res.status(201).json({
        success: true,
        message: 'Maintenance schedule created successfully',
        data: maintenance
      });
    } catch (error) {
      console.error('Error creating maintenance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create maintenance schedule',
        error: error.message
      });
    }
  }

  /**
   * Check for booking conflicts (without creating maintenance)
   */
  static async checkConflicts(req, res) {
    try {
      const { trainId, startDate, endDate } = req.query;

      if (!trainId || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Train ID, start date, and end date are required'
        });
      }

      const conflicts = await Maintenance.checkBookingConflicts(trainId, startDate, endDate);
      
      res.json({
        success: true,
        data: conflicts
      });
    } catch (error) {
      console.error('Error checking conflicts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check conflicts',
        error: error.message
      });
    }
  }

  /**
   * Update maintenance schedule
   */
  static async updateMaintenance(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, reason } = req.body;

      // Check if maintenance exists
      const existing = await Maintenance.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance schedule not found'
        });
      }

      // Check for booking conflicts with new dates
      const conflicts = await Maintenance.checkBookingConflicts(
        existing.train_id, 
        startDate || existing.start_date, 
        endDate || existing.end_date
      );
      
      if (conflicts.hasConflicts) {
        return res.status(409).json({
          success: false,
          message: `Cannot update maintenance. There are ${conflicts.conflictCount} existing bookings during this period.`,
          conflicts: {
            count: conflicts.conflictCount,
            dates: conflicts.datesWithBookings
          }
        });
      }

      const updated = await Maintenance.update(id, {
        startDate: startDate || existing.start_date,
        endDate: endDate || existing.end_date,
        reason: reason || existing.reason
      });

      // Broadcast maintenance update to all connected clients
      broadcastMaintenanceUpdate({
        type: 'maintenance_updated',
        trainId: updated.train_id,
        maintenanceId: id,
        maintenance: {
          id: updated.id,
          trainId: updated.train_id,
          startDate: updated.start_date,
          endDate: updated.end_date,
          reason: updated.reason,
          status: updated.status
        }
      });

      res.json({
        success: true,
        message: 'Maintenance schedule updated successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error updating maintenance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update maintenance schedule',
        error: error.message
      });
    }
  }

  /**
   * End maintenance early
   */
  static async endMaintenanceEarly(req, res) {
    try {
      const { id } = req.params;

      const existing = await Maintenance.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance schedule not found'
        });
      }

      const updated = await Maintenance.endEarly(id);

      // Broadcast maintenance cancellation to all connected clients
      broadcastMaintenanceUpdate({
        type: 'maintenance_cancelled',
        trainId: existing.train_id,
        maintenanceId: id,
        maintenance: {
          id: updated.id,
          trainId: updated.train_id,
          startDate: updated.start_date,
          endDate: updated.end_date,
          status: updated.status,
          cancelledAt: updated.cancelled_at
        }
      });

      res.json({
        success: true,
        message: 'Maintenance ended successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error ending maintenance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end maintenance',
        error: error.message
      });
    }
  }

  /**
   * Delete maintenance schedule
   */
  static async deleteMaintenance(req, res) {
    try {
      const { id } = req.params;

      const existing = await Maintenance.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance schedule not found'
        });
      }

      await Maintenance.delete(id);

      res.json({
        success: true,
        message: 'Maintenance schedule deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete maintenance schedule',
        error: error.message
      });
    }
  }
}

export default MaintenanceController;
