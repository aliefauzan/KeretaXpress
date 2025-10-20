import pool from '../config/database.js';

class Train {
  static async getAll() {
    try {
      const result = await pool.query(
        `SELECT t.*, 
                ds.name as departure_station_name, ds.city as departure_city,
                as_station.name as arrival_station_name, as_station.city as arrival_city
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
      const result = await pool.query(
        `SELECT t.*, 
                ds.name as departure_station_name, ds.city as departure_city,
                as_station.name as arrival_station_name, as_station.city as arrival_city
         FROM trains t
         JOIN stations ds ON t.departure_station_id = ds.id
         JOIN stations as_station ON t.arrival_station_id = as_station.id
         WHERE t.departure_station_id = $1 
           AND t.arrival_station_id = $2
           AND t.available_seats > 0
         ORDER BY t.departure_time ASC`,
        [departureStationId, arrivalStationId]
      );
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

      // Get booked seats
      const bookedResult = await pool.query(
        'SELECT seat_number FROM bookings WHERE train_id = $1 AND travel_date = $2',
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
