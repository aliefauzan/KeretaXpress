import pool from '../config/database.js';

class Maintenance {
  /**
   * Create new maintenance schedule
   */
  static async create({ trainId, startDate, endDate, reason, createdByAdminId }) {
    try {
      const result = await pool.query(
        `INSERT INTO train_maintenance 
         (train_id, start_date, end_date, reason, created_by_admin_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'scheduled', NOW(), NOW())
         RETURNING *`,
        [trainId, startDate, endDate, reason, createdByAdminId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all maintenance schedules
   */
  static async getAll() {
    try {
      const result = await pool.query(
        `SELECT tm.*, 
                t.name as train_name, 
                t.operator as train_operator,
                a.name as admin_name,
                a.email as admin_email
         FROM train_maintenance tm
         JOIN trains t ON tm.train_id = t.id
         JOIN admins a ON tm.created_by_admin_id = a.id
         ORDER BY tm.start_date DESC`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get maintenance schedules for a specific train
   */
  static async getByTrainId(trainId) {
    try {
      const result = await pool.query(
        `SELECT tm.*, 
                a.name as admin_name,
                a.email as admin_email
         FROM train_maintenance tm
         JOIN admins a ON tm.created_by_admin_id = a.id
         WHERE tm.train_id = $1
         ORDER BY tm.start_date DESC`,
        [trainId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get maintenance schedule by ID
   */
  static async getById(id) {
    try {
      const result = await pool.query(
        `SELECT tm.*, 
                t.name as train_name, 
                t.operator as train_operator,
                a.name as admin_name,
                a.email as admin_email
         FROM train_maintenance tm
         JOIN trains t ON tm.train_id = t.id
         JOIN admins a ON tm.created_by_admin_id = a.id
         WHERE tm.id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if train is in maintenance on a specific date
   */
  static async isTrainInMaintenance(trainId, date) {
    try {
      const result = await pool.query(
        `SELECT * FROM train_maintenance 
         WHERE train_id = $1 
           AND start_date <= $2 
           AND end_date >= $2`,
        [trainId, date]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current maintenance for a train (today)
   */
  static async getCurrentMaintenance(trainId) {
    try {
      const result = await pool.query(
        `SELECT * FROM train_maintenance 
         WHERE train_id = $1 
           AND CURRENT_DATE BETWEEN start_date AND end_date
         ORDER BY start_date DESC
         LIMIT 1`,
        [trainId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get active maintenance schedules (ongoing today)
   */
  static async getActiveMaintenance() {
    try {
      const result = await pool.query(
        `SELECT tm.*, 
                t.name as train_name, 
                t.operator as train_operator,
                a.name as admin_name,
                a.email as admin_email
         FROM train_maintenance tm
         JOIN trains t ON tm.train_id = t.id
         JOIN admins a ON tm.created_by_admin_id = a.id
         WHERE CURRENT_DATE BETWEEN tm.start_date AND tm.end_date
         ORDER BY tm.start_date DESC`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check for booking conflicts with maintenance dates
   */
  static async checkBookingConflicts(trainId, startDate, endDate) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as conflict_count,
                array_agg(DISTINCT travel_date) as dates_with_bookings
         FROM bookings
         WHERE train_id = $1 
           AND travel_date BETWEEN $2 AND $3
           AND status NOT IN ('cancelled', 'refunded')`,
        [trainId, startDate, endDate]
      );
      return {
        hasConflicts: parseInt(result.rows[0].conflict_count) > 0,
        conflictCount: parseInt(result.rows[0].conflict_count),
        datesWithBookings: result.rows[0].dates_with_bookings || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update maintenance schedule
   */
  static async update(id, { startDate, endDate, reason }) {
    try {
      const result = await pool.query(
        `UPDATE train_maintenance 
         SET start_date = $1, 
             end_date = $2, 
             reason = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [startDate, endDate, reason, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * End maintenance early (cancel it by updating status)
   */
  static async endEarly(id) {
    try {
      const result = await pool.query(
        `UPDATE train_maintenance 
         SET status = 'cancelled',
             cancelled_at = NOW(),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete maintenance schedule
   */
  static async delete(id) {
    try {
      const result = await pool.query(
        `DELETE FROM train_maintenance 
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default Maintenance;
