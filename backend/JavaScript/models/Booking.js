import pool from '../config/database.js';

class Booking {
  static async create(bookingData, client = pool) {
    try {
      const {
        transactionId,
        userUuid,
        trainId,
        travelDate,
        passengerName,
        passengerIdNumber,
        passengerDob,
        passengerGender,
        seatNumber,
        paymentMethod,
        status,
        totalPrice
      } = bookingData;

      const result = await client.query(
        `INSERT INTO bookings (
          transaction_id, user_uuid, train_id, travel_date,
          passenger_name, passenger_id_number, passenger_dob, passenger_gender,
          seat_number, payment_method, status, total_price,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *`,
        [
          transactionId, userUuid, trainId, travelDate,
          passengerName, passengerIdNumber, passengerDob, passengerGender,
          seatNumber, paymentMethod, status, totalPrice
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByTransactionId(transactionId) {
    try {
      const result = await pool.query(
        `SELECT b.*, 
                t.name as train_name, t.operator, t.class_type,
                ds.name as departure_station_name, ds.city as departure_city,
                as_station.name as arrival_station_name, as_station.city as arrival_city,
                t.departure_time, t.arrival_time
         FROM bookings b
         JOIN trains t ON b.train_id = t.id
         JOIN stations ds ON t.departure_station_id = ds.id
         JOIN stations as_station ON t.arrival_station_id = as_station.id
         WHERE b.transaction_id = $1`,
        [transactionId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByUserUuid(userUuid) {
    try {
      const result = await pool.query(
        `SELECT b.*, 
                t.name as train_name, t.operator, t.class_type,
                t.departure_time, t.arrival_time,
                json_build_object(
                  'id', ds.id,
                  'name', ds.name,
                  'city', ds.city,
                  'address', ds.address
                ) as departure_station,
                json_build_object(
                  'id', as_station.id,
                  'name', as_station.name,
                  'city', as_station.city,
                  'address', as_station.address
                ) as arrival_station,
                json_build_object(
                  'id', t.id,
                  'name', t.name,
                  'operator', t.operator,
                  'class_type', t.class_type,
                  'price', t.price,
                  'departure_time', t.departure_time,
                  'arrival_time', t.arrival_time,
                  'departure_station', json_build_object(
                    'id', ds.id,
                    'name', ds.name,
                    'city', ds.city
                  ),
                  'arrival_station', json_build_object(
                    'id', as_station.id,
                    'name', as_station.name,
                    'city', as_station.city
                  )
                ) as train
         FROM bookings b
         JOIN trains t ON b.train_id = t.id
         JOIN stations ds ON t.departure_station_id = ds.id
         JOIN stations as_station ON t.arrival_station_id = as_station.id
         WHERE b.user_uuid = $1
         ORDER BY b.created_at DESC`,
        [userUuid]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(transactionId, status) {
    try {
      const result = await pool.query(
        `UPDATE bookings 
         SET status = $1, updated_at = NOW()
         WHERE transaction_id = $2
         RETURNING *`,
        [status, transactionId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async isSeatBooked(trainId, travelDate, seatNumber) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM bookings WHERE train_id = $1 AND travel_date = $2 AND seat_number = $3',
        [trainId, travelDate, seatNumber]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }

  static async cancel(transactionId, cancelledBy = 'customer') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get the booking details first
      const bookingResult = await client.query(
        `SELECT * FROM bookings 
         WHERE transaction_id = $1 AND status NOT IN ('cancelled', 'paid')
         FOR UPDATE`,
        [transactionId]
      );
      
      if (bookingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      const booking = bookingResult.rows[0];
      
      // Update booking status to cancelled
      const cancelResult = await client.query(
        `UPDATE bookings 
         SET status = 'cancelled', 
             updated_at = NOW()
         WHERE transaction_id = $1
         RETURNING *`,
        [transactionId]
      );
      
      // Increment available seats back to the train
      await client.query(
        `UPDATE trains 
         SET available_seats = available_seats + 1, 
             updated_at = NOW()
         WHERE id = $1`,
        [booking.train_id]
      );
      
      await client.query('COMMIT');
      return cancelResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async canBeCancelled(transactionId, userUuid = null) {
    try {
      let query = `
        SELECT b.*, b.status, b.user_uuid
        FROM bookings b
        WHERE b.transaction_id = $1
      `;
      const params = [transactionId];
      
      if (userUuid) {
        query += ` AND b.user_uuid = $2`;
        params.push(userUuid);
      }
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        return { canCancel: false, reason: 'Booking tidak ditemukan' };
      }
      
      const booking = result.rows[0];
      
      // Cannot cancel if already paid or already cancelled
      if (booking.status === 'paid') {
        return { canCancel: false, reason: 'Booking yang sudah dibayar tidak dapat dibatalkan' };
      }
      
      if (booking.status === 'cancelled') {
        return { canCancel: false, reason: 'Booking sudah dibatalkan sebelumnya' };
      }
      
      return { canCancel: true, booking };
    } catch (error) {
      throw error;
    }
  }
}

export default Booking;
