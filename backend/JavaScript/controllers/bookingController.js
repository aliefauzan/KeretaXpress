import { validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Train from '../models/Train.js';
import User from '../models/User.js';
import pool from '../config/database.js';

class BookingController {
  // Generate random transaction ID
  static generateTransactionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'KX-';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Create booking
  static async book(req, res) {
    const client = await pool.connect();
    
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const {
        user_uuid,
        train_id,
        travel_date,
        passenger_name,
        passenger_id_number,
        passenger_dob,
        passenger_gender,
        payment_method,
        seat_number
      } = req.body;

      // Start transaction
      await client.query('BEGIN');

      // Check if user exists
      const user = await User.findByUuid(user_uuid);
      if (!user) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'User not found' });
      }

      // Lock train row and get train details
      const trainResult = await client.query(
        'SELECT * FROM trains WHERE id = $1 FOR UPDATE',
        [train_id]
      );

      if (trainResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Train not found' });
      }

      const train = trainResult.rows[0];

      // Check available seats
      if (train.available_seats <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: 'No available seats for this train' 
        });
      }

      // Check if seat is already booked
      const seatBooked = await Booking.isSeatBooked(train_id, travel_date, seat_number);
      if (seatBooked) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: 'Seat is already booked' 
        });
      }

      // Decrement available seats
      await client.query(
        `UPDATE trains 
         SET available_seats = available_seats - 1, updated_at = NOW()
         WHERE id = $1`,
        [train_id]
      );

      // Create booking
      const transactionId = BookingController.generateTransactionId();
      const bookingData = {
        transactionId,
        userUuid: user_uuid,
        trainId: train_id,
        travelDate: travel_date,
        passengerName: passenger_name,
        passengerIdNumber: passenger_id_number,
        passengerDob: passenger_dob,
        passengerGender: passenger_gender,
        seatNumber: seat_number,
        paymentMethod: payment_method,
        status: '',
        totalPrice: train.price
      };

      const booking = await Booking.create(bookingData, client);

      // Commit transaction
      await client.query('COMMIT');

      return res.status(201).json(booking);
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Booking error:', error);
      
      if (error.message === 'No available seats for this train') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  // Get booking history
  static async history(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { user_uuid } = req.query;

      // Check if user exists
      const user = await User.findByUuid(user_uuid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get bookings
      const bookings = await Booking.findByUserUuid(user_uuid);

      return res.status(200).json(bookings);
    } catch (error) {
      console.error('Booking history error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Update booking status
  static async updateStatus(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { transactionId } = req.params;
      const { status } = req.body;

      // Find booking
      const booking = await Booking.findByTransactionId(transactionId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Update status
      const updatedBooking = await Booking.updateStatus(transactionId, status);

      return res.status(200).json(updatedBooking);
    } catch (error) {
      console.error('Update booking status error:', error);
      return res.status(500).json({ 
        message: 'Internal server error during status update' 
      });
    }
  }
}

export default BookingController;
