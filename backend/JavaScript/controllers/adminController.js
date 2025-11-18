import { validationResult } from 'express-validator';
import pool from '../config/database.js';
import Train from '../models/Train.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import bookingExpirationService from '../services/bookingExpirationService.js';

class AdminController {
  // ==================== TRAIN MANAGEMENT ====================
  
  // Create new train
  static async createTrain(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const formattedErrors = {};
        errors.array().forEach(error => {
          const field = error.path || error.param;
          if (!formattedErrors[field]) {
            formattedErrors[field] = [];
          }
          formattedErrors[field].push(error.msg);
        });
        return res.status(422).json({ errors: formattedErrors });
      }

      const {
        name,
        operator,
        class_type,
        available_seats,
        departure_station_id,
        arrival_station_id,
        departure_time,
        arrival_time,
        price
      } = req.body;

      // Validate different stations
      if (departure_station_id === arrival_station_id) {
        return res.status(422).json({
          errors: {
            arrival_station_id: ['Arrival station must be different from departure station']
          }
        });
      }

      // Calculate duration in minutes
      const calculateDuration = (start, end) => {
        const [startHours, startMinutes] = start.split(':').map(Number);
        const [endHours, endMinutes] = end.split(':').map(Number);
        let duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        // Handle overnight trips (if arrival is earlier than departure)
        if (duration < 0) duration += 24 * 60;
        return duration;
      };

      const duration_minutes = calculateDuration(departure_time, arrival_time);

      const result = await pool.query(
        `INSERT INTO trains (
          name, operator, class_type, available_seats, 
          departure_station_id, arrival_station_id, 
          departure_time, arrival_time, duration_minutes, price,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`,
        [
          name,
          operator || 'PT. KAI',
          class_type,
          available_seats,
          departure_station_id,
          arrival_station_id,
          departure_time,
          arrival_time,
          duration_minutes,
          price
        ]
      );

      const train = result.rows[0];

      // Log admin action
      console.log(`✅ Admin ${req.admin.email} created train: ${train.name} (ID: ${train.id})`);

      return res.status(201).json({
        message: 'Train created successfully',
        train: train
      });
    } catch (error) {
      console.error('Create train error:', error);
      
      // Handle specific database errors
      if (error.code === '22003') {
        return res.status(422).json({ 
          message: 'Price value is too large. Maximum allowed is 9,999,999,999.99',
          errors: {
            price: ['Price exceeds maximum allowed value']
          }
        });
      }
      
      if (error.code === '23503') {
        return res.status(422).json({ 
          message: 'Invalid station ID provided',
          errors: {
            station: ['Departure or arrival station does not exist']
          }
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to create train',
        error: error.message 
      });
    }
  }

  // Update train
  static async updateTrain(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        operator,
        class_type,
        available_seats,
        departure_station_id,
        arrival_station_id,
        departure_time,
        arrival_time,
        price
      } = req.body;

      // Check if train exists
      const existingTrain = await Train.findById(id);
      if (!existingTrain) {
        return res.status(404).json({ message: 'Train not found' });
      }

      // Validate different stations (if both provided)
      if (departure_station_id && arrival_station_id && 
          departure_station_id === arrival_station_id) {
        return res.status(422).json({
          errors: {
            arrival_station_id: ['Arrival station must be different from departure station']
          }
        });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (operator !== undefined) {
        updates.push(`operator = $${paramCount++}`);
        values.push(operator);
      }
      if (class_type !== undefined) {
        updates.push(`class_type = $${paramCount++}`);
        values.push(class_type);
      }
      if (available_seats !== undefined) {
        updates.push(`available_seats = $${paramCount++}`);
        values.push(available_seats);
      }
      if (departure_station_id !== undefined) {
        updates.push(`departure_station_id = $${paramCount++}`);
        values.push(departure_station_id);
      }
      if (arrival_station_id !== undefined) {
        updates.push(`arrival_station_id = $${paramCount++}`);
        values.push(arrival_station_id);
      }
      if (departure_time !== undefined) {
        updates.push(`departure_time = $${paramCount++}`);
        values.push(departure_time);
      }
      if (arrival_time !== undefined) {
        updates.push(`arrival_time = $${paramCount++}`);
        values.push(arrival_time);
      }
      
      // Recalculate duration if times are updated
      if (departure_time !== undefined || arrival_time !== undefined) {
        const depTime = departure_time || existingTrain.departure_time;
        const arrTime = arrival_time || existingTrain.arrival_time;
        
        const calculateDuration = (start, end) => {
          const [startHours, startMinutes] = start.split(':').map(Number);
          const [endHours, endMinutes] = end.split(':').map(Number);
          let duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
          if (duration < 0) duration += 24 * 60;
          return duration;
        };
        
        const duration_minutes = calculateDuration(depTime, arrTime);
        updates.push(`duration_minutes = $${paramCount++}`);
        values.push(duration_minutes);
      }
      
      if (price !== undefined) {
        updates.push(`price = $${paramCount++}`);
        values.push(price);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE trains 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      const train = result.rows[0];

      // Log admin action
      console.log(`✅ Admin ${req.admin.email} updated train ID: ${id}`);

      return res.status(200).json({
        message: 'Train updated successfully',
        train: train
      });
    } catch (error) {
      console.error('Update train error:', error);
      
      // Handle specific database errors
      if (error.code === '22003') {
        return res.status(422).json({ 
          message: 'Price value is too large. Maximum allowed is 9,999,999,999.99',
          errors: {
            price: ['Price exceeds maximum allowed value']
          }
        });
      }
      
      if (error.code === '23503') {
        return res.status(422).json({ 
          message: 'Invalid station ID provided',
          errors: {
            station: ['Departure or arrival station does not exist']
          }
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to update train',
        error: error.message 
      });
    }
  }

  // Delete train
  static async deleteTrain(req, res) {
    try {
      const { id } = req.params;

      // Check if train exists
      const existingTrain = await Train.findById(id);
      if (!existingTrain) {
        return res.status(404).json({ message: 'Train not found' });
      }

      // Check if train has bookings (prevent deletion if has bookings)
      const bookingsResult = await pool.query(
        'SELECT COUNT(*) FROM bookings WHERE train_id = $1',
        [id]
      );

      const bookingsCount = parseInt(bookingsResult.rows[0].count);
      if (bookingsCount > 0) {
        return res.status(400).json({ 
          message: `Cannot delete train. There are ${bookingsCount} bookings associated with this train.`,
          bookings_count: bookingsCount
        });
      }

      // Delete train
      await pool.query('DELETE FROM trains WHERE id = $1', [id]);

      // Log admin action
      console.log(`✅ Admin ${req.admin.email} deleted train ID: ${id} (${existingTrain.name})`);

      return res.status(200).json({
        message: 'Train deleted successfully',
        deleted_train: existingTrain
      });
    } catch (error) {
      console.error('Delete train error:', error);
      
      // Handle foreign key constraint errors
      if (error.code === '23503') {
        return res.status(400).json({ 
          message: 'Cannot delete train. It is referenced by existing bookings or other records.'
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to delete train',
        error: error.message 
      });
    }
  }

  // Get all trains (admin view with more details)
  static async getAllTrains(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          t.*,
          ds.name as departure_station_name,
          ds.city as departure_city,
          as2.name as arrival_station_name,
          as2.city as arrival_city,
          (
            SELECT COUNT(*) 
            FROM bookings b 
            WHERE b.train_id = t.id 
            AND b.status IN ('pending', 'paid')
          ) as total_bookings,
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
        LEFT JOIN stations ds ON t.departure_station_id = ds.id
        LEFT JOIN stations as2 ON t.arrival_station_id = as2.id
        ORDER BY t.created_at DESC
      `);

      return res.status(200).json({
        trains: result.rows,
        total: result.rows.length
      });
    } catch (error) {
      console.error('Get all trains error:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch trains',
        error: error.message 
      });
    }
  }

  // ==================== PAYMENT MANAGEMENT ====================

  // Manual payment confirmation (fallback when webhook fails)
  static async confirmPayment(req, res) {
    try {
      const { transaction_id } = req.params;
      const { status, notes } = req.body;

      if (!['paid', 'failed', 'cancelled'].includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status. Must be one of: paid, failed, cancelled' 
        });
      }

      // Find booking
      const booking = await Booking.findByTransactionId(transaction_id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if already in final state
      if (['paid', 'confirmed', 'cancelled'].includes(booking.status)) {
        return res.status(400).json({ 
          message: `Booking is already ${booking.status}. Cannot change status.`,
          current_status: booking.status
        });
      }

      // Map payment status to booking status
      let bookingStatus = status;
      if (status === 'paid') {
        bookingStatus = 'confirmed'; // Use 'confirmed' for successful payments
      }

      // Update booking status
      await Booking.updateStatus(transaction_id, bookingStatus);

      // ✅ Cancel automatic expiration timer if payment confirmed
      if (status === 'paid') {
        bookingExpirationService.cancelExpiration(transaction_id);
      }

      // Log admin action with notes
      console.log(`✅ Admin ${req.admin.email} manually confirmed payment for ${transaction_id}: ${status}`);
      if (notes) {
        console.log(`   Notes: ${notes}`);
      }

      // Store admin action in database (optional audit log)
      await pool.query(
        `INSERT INTO booking_history (
          booking_id, old_status, new_status, 
          changed_by_admin_id, reason, created_at
        ) VALUES (
          (SELECT id FROM bookings WHERE transaction_id = $1),
          $2, $3, $4, $5, NOW()
        )`,
        [transaction_id, booking.status, status, req.admin.id, notes || 'Manual payment confirmation by admin']
      ).catch(err => {
        // If booking_history table doesn't exist yet, just log
        console.log('Note: booking_history table not available for audit log');
      });

      // Get updated booking
      const updatedBooking = await Booking.findByTransactionId(transaction_id);

      // Create notification for customer
      if (status === 'paid') {
        try {
          await Notification.create({
            type: 'payment.completed',
            notifiableType: 'payment',
            notifiableId: booking.id,
            data: {
              user_uuid: booking.user_uuid,
              transaction_id: transaction_id,
              booking_code: transaction_id,
              amount: booking.total_price,
              title: 'Pembayaran Dikonfirmasi',
              message: `Pembayaran untuk booking ${transaction_id} telah dikonfirmasi oleh admin.`,
              triggered_by: 'admin',
              admin_email: req.admin.email,
              notes: notes
            }
          });

          console.log(`✅ Notification sent to customer for confirmed payment: ${transaction_id}`);
        } catch (notifError) {
          console.error('⚠️  Failed to create notification:', notifError);
        }

        // 🔔 Broadcast to user's booking page (real-time update)
        try {
          const { notifyUserBooking } = await import('../routes/bookingStreamRoutes.js');
          notifyUserBooking(booking.user_uuid, 'booking.payment_confirmed', {
            transaction_id: transaction_id,
            booking_code: transaction_id,
            status: 'paid',
            total_price: booking.total_price,
            confirmed_by: req.admin.email,
            confirmed_at: new Date().toISOString()
          });
        } catch (broadcastError) {
          console.error('⚠️  Failed to broadcast booking update:', broadcastError);
        }
      }

      // 🔔 Broadcast to all admin clients (real-time update)
      try {
        const { broadcastToAdmins } = await import('../routes/adminStreamRoutes.js');
        broadcastToAdmins('booking.payment_updated', {
          transaction_id: transaction_id,
          booking_code: transaction_id,
          old_status: booking.status,
          new_status: status,
          confirmed_by: req.admin.email,
          timestamp: new Date().toISOString()
        });
      } catch (broadcastError) {
        console.error('⚠️  Failed to broadcast to admins:', broadcastError);
      }

      return res.status(200).json({
        message: 'Payment status updated successfully',
        transaction_id: transaction_id,
        old_status: booking.status,
        new_status: status,
        booking: updatedBooking,
        confirmed_by: req.admin.email,
        notes: notes
      });
    } catch (error) {
      console.error('Confirm payment error:', error);
      return res.status(500).json({ 
        message: 'Failed to confirm payment',
        error: error.message 
      });
    }
  }

  // Get all bookings (admin view)
  static async getAllBookings(req, res) {
    try {
      const { status, date_from, date_to } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      let query = `
        SELECT 
          b.id,
          b.transaction_id as booking_code,
          b.user_uuid,
          b.train_id,
          b.travel_date as booking_date,
          b.passenger_name,
          b.passenger_id_number,
          b.seat_number,
          b.total_price as total_amount,
          b.status,
          b.payment_method,
          b.created_at,
          u.name as user_name,
          u.email as user_email,
          t.name as train_name,
          t.class_type,
          t.departure_time,
          t.arrival_time,
          ds.name as departure_station_name,
          as2.name as arrival_station_name,
          CASE 
            WHEN b.status = 'confirmed' THEN 'paid'
            WHEN b.status = 'paid' THEN 'paid'
            ELSE 'pending'
          END as payment_status,
          1 as passenger_count
        FROM bookings b
        LEFT JOIN users u ON b.user_uuid = u.uuid
        LEFT JOIN trains t ON b.train_id = t.id
        LEFT JOIN stations ds ON t.departure_station_id = ds.id
        LEFT JOIN stations as2 ON t.arrival_station_id = as2.id
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 1;

      // Filter by status
      if (status) {
        query += ` AND b.status = $${paramCount++}`;
        values.push(status);
      }

      // Filter by date range
      if (date_from) {
        query += ` AND b.created_at >= $${paramCount++}`;
        values.push(date_from);
      }
      if (date_to) {
        query += ` AND b.created_at <= $${paramCount++}`;
        values.push(date_to);
      }

      query += ` ORDER BY b.created_at DESC`;

      // Pagination
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM bookings b WHERE 1=1';
      const countValues = [];
      let countParamCount = 1;

      if (status) {
        countQuery += ` AND b.status = $${countParamCount++}`;
        countValues.push(status);
      }
      if (date_from) {
        countQuery += ` AND b.created_at >= $${countParamCount++}`;
        countValues.push(date_from);
      }
      if (date_to) {
        countQuery += ` AND b.created_at <= $${countParamCount++}`;
        countValues.push(date_to);
      }

      const countResult = await pool.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].count);

      return res.status(200).json({
        bookings: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get all bookings error:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch bookings',
        error: error.message 
      });
    }
  }

  // Get booking statistics (dashboard)
  static async getBookingStats(req, res) {
    try {
      const { period, date_from, date_to } = req.query;
      
      // Build date filter condition
      let dateCondition = '';
      const dateParams = [];
      let paramCount = 1;
      
      if (period) {
        switch (period) {
          case '1d':
            dateCondition = `AND created_at >= NOW() - INTERVAL '1 day'`;
            break;
          case '7d':
            dateCondition = `AND created_at >= NOW() - INTERVAL '7 days'`;
            break;
          case '30d':
            dateCondition = `AND created_at >= NOW() - INTERVAL '30 days'`;
            break;
          case 'custom':
            if (date_from && date_to) {
              dateCondition = `AND created_at >= $${paramCount++} AND created_at <= $${paramCount++}`;
              dateParams.push(date_from, date_to);
            }
            break;
          default:
            // 'all' or invalid - no date filter
            break;
        }
      }
      
      const statsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
          COUNT(*) FILTER (WHERE status IN ('paid', 'confirmed')) as paid_count,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
          COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
          COUNT(*) as total_bookings,
          COALESCE(SUM(total_price) FILTER (WHERE status IN ('paid', 'confirmed')), 0) as total_revenue,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as bookings_last_7_days,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as bookings_last_30_days
        FROM bookings
        WHERE 1=1 ${dateCondition}
      `;

      const result = await pool.query(statsQuery, dateParams);
      const stats = result.rows[0];

      return res.status(200).json({
        statistics: {
          pending_bookings: parseInt(stats.pending_count),
          paid_bookings: parseInt(stats.paid_count),
          cancelled_bookings: parseInt(stats.cancelled_count),
          expired_bookings: parseInt(stats.expired_count),
          total_bookings: parseInt(stats.total_bookings),
          total_revenue: parseFloat(stats.total_revenue || 0),
          bookings_last_7_days: parseInt(stats.bookings_last_7_days),
          bookings_last_30_days: parseInt(stats.bookings_last_30_days)
        },
        filter: {
          period: period || 'all',
          date_from: date_from || null,
          date_to: date_to || null
        }
      });
    } catch (error) {
      console.error('Get booking stats error:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch statistics',
        error: error.message 
      });
    }
  }

  // Cancel booking (Admin)
  static async cancelBooking(req, res) {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;

      // Check if booking can be cancelled (no user restriction for admin)
      const checkResult = await Booking.canBeCancelled(transactionId);
      
      if (!checkResult.canCancel) {
        return res.status(403).json({ 
          message: checkResult.reason 
        });
      }

      // Cancel the booking
      const cancelledBooking = await Booking.cancel(transactionId, 'admin');
      
      if (!cancelledBooking) {
        return res.status(404).json({ 
          message: 'Booking tidak ditemukan atau tidak dapat dibatalkan' 
        });
      }

      // Log admin action
      console.log(`✅ Admin ${req.admin.email} cancelled booking: ${transactionId}${reason ? ` - Reason: ${reason}` : ''}`);

      // Create notification for customer
      try {
        await Notification.create({
          type: 'booking.cancelled',
          notifiableType: 'booking',
          notifiableId: cancelledBooking.id,
          data: {
            user_uuid: cancelledBooking.user_uuid,
            transaction_id: transactionId,
            booking_code: cancelledBooking.booking_code,
            title: 'Booking Dibatalkan oleh Admin',
            message: `Booking ${cancelledBooking.booking_code} telah dibatalkan oleh admin.${reason ? ` Alasan: ${reason}` : ''}`,
            triggered_by: 'admin',
            admin_email: req.admin.email,
            reason: reason
          }
        });

        console.log(`✅ Notification sent to customer for cancelled booking: ${transactionId}`);
      } catch (notifError) {
        console.error('⚠️  Failed to create notification:', notifError);
      }

      return res.status(200).json({ 
        message: 'Booking berhasil dibatalkan oleh admin',
        booking: cancelledBooking 
      });
    } catch (error) {
      console.error('Admin cancel booking error:', error);
      return res.status(500).json({ 
        message: 'Gagal membatalkan booking. Silakan coba lagi.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default AdminController;
