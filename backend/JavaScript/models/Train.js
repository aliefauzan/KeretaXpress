import pool from '../config/database.js';

class Train {
  static async getAll() {
    try {
      const result = await pool.query(
        `SELECT t.*, 
                ds.name as departure_station_name, ds.city as departure_city,
                as_station.name as arrival_station_name, as_station.city as arrival_city,
                CASE 
                  WHEN EXISTS (
                    SELECT 1 FROM train_maintenance tm 
                    WHERE tm.train_id = t.id 
                      AND CURRENT_DATE >= tm.start_date 
                      AND CURRENT_DATE <= tm.end_date
                      AND tm.status IN ('scheduled', 'active')
                  ) THEN 'maintenance'
                  ELSE 'active'
                END as status,
                (SELECT json_build_object(
                  'id', tm.id,
                  'start_date', tm.start_date,
                  'end_date', tm.end_date,
                  'reason', tm.reason
                ) FROM train_maintenance tm
                WHERE tm.train_id = t.id 
                  AND CURRENT_DATE >= tm.start_date 
                  AND CURRENT_DATE <= tm.end_date
                  AND tm.status IN ('scheduled', 'active')
                LIMIT 1) as current_maintenance
         FROM trains t
         JOIN stations ds ON t.departure_station_id = ds.id
         JOIN stations as_station ON t.arrival_station_id = as_station.id
         ORDER BY t.departure_time ASC`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT t.*, 
                ds.name as departure_station_name, ds.city as departure_city,
                as_station.name as arrival_station_name, as_station.city as arrival_city
         FROM trains t
         JOIN stations ds ON t.departure_station_id = ds.id
         JOIN stations as_station ON t.arrival_station_id = as_station.id
         WHERE t.id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async search({ departureStationId, arrivalStationId, date }) {
    try {
      // Note: departure_time and arrival_time are TIME type (not TIMESTAMP)
      // The date parameter is for the travel_date in bookings, not in trains table
      // Trains have recurring schedules (same time every day)
      
      let query = `SELECT t.*, 
                ds.name as departure_station_name, ds.city as departure_city,
                as_station.name as arrival_station_name, as_station.city as arrival_city,
                CASE 
                  WHEN EXISTS (
                    SELECT 1 FROM train_maintenance tm 
                    WHERE tm.train_id = t.id 
                      AND $1::date >= tm.start_date 
                      AND $1::date <= tm.end_date
                      AND tm.status IN ('scheduled', 'active')
                  ) THEN 'maintenance'
                  ELSE 'active'
                END as status,
                (SELECT json_build_object(
                  'id', tm.id,
                  'start_date', tm.start_date,
                  'end_date', tm.end_date,
                  'reason', tm.reason
                ) FROM train_maintenance tm
                WHERE tm.train_id = t.id 
                  AND $1::date >= tm.start_date 
                  AND $1::date <= tm.end_date
                  AND tm.status IN ('scheduled', 'active')
                LIMIT 1) as current_maintenance
         FROM trains t
         JOIN stations ds ON t.departure_station_id = ds.id
         JOIN stations as_station ON t.arrival_station_id = as_station.id
         WHERE t.available_seats > 0`;

      const params = [date];
      let paramCount = 1;

      if (departureStationId) {
        paramCount++;
        query += ` AND t.departure_station_id = $${paramCount}`;
        params.push(departureStationId);
      }

      if (arrivalStationId) {
        paramCount++;
        query += ` AND t.arrival_station_id = $${paramCount}`;
        params.push(arrivalStationId);
      }

      query += ` ORDER BY t.departure_time ASC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getPromoTrains() {
    try {
      const result = await pool.query(
        `SELECT t.*, 
                ds.name as departure_station_name, ds.city as departure_city,
                as_station.name as arrival_station_name, as_station.city as arrival_city
         FROM trains t
         JOIN stations ds ON t.departure_station_id = ds.id
         JOIN stations as_station ON t.arrival_station_id = as_station.id
         WHERE t.available_seats > 10
         ORDER BY t.price ASC
         LIMIT 3`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getAvailableSeats(trainId, travelDate) {
    try {
      // Get train to know total seats
      const trainResult = await pool.query(
        'SELECT available_seats FROM trains WHERE id = $1',
        [trainId]
      );
      
      if (trainResult.rows.length === 0) {
        return [];
      }

      const totalSeats = trainResult.rows[0].available_seats;
      
      // Generate all seats (A1 to A{totalSeats})
      const allSeats = Array.from({ length: totalSeats }, (_, i) => `A${i + 1}`);

      // Get booked seats - exclude cancelled bookings
      const bookedResult = await pool.query(
        `SELECT seat_number FROM bookings 
         WHERE train_id = $1 AND travel_date = $2 AND status != 'cancelled'`,
        [trainId, travelDate]
      );

      const bookedSeats = bookedResult.rows.map(row => row.seat_number);

      // Return available seats
      return allSeats.filter(seat => !bookedSeats.includes(seat));
    } catch (error) {
      throw error;
    }
  }

  static async decrementAvailableSeats(trainId, client = pool) {
    try {
      const result = await client.query(
        `UPDATE trains 
         SET available_seats = available_seats - 1, updated_at = NOW()
         WHERE id = $1 AND available_seats > 0
         RETURNING *`,
        [trainId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async incrementAvailableSeats(trainId, client = pool) {
    try {
      const result = await client.query(
        `UPDATE trains 
         SET available_seats = available_seats + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [trainId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default Train;
