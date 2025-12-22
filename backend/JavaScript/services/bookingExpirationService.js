import pool from '../config/database.js';
import Notification from '../models/Notification.js';

/**
 * BookingExpirationService
 * Handles per-booking expiration timeouts
 * Schedules individual timers for each booking (30 minutes)
 */
class BookingExpirationService {
  constructor() {
    // Store active timers: { transaction_id: timeoutId }
    this.activeTimers = new Map();
  }

  /**
   * Schedule expiration for a specific booking
   * Called immediately after booking creation
   * @param {string} transactionId - Booking transaction ID
   * @param {number} expirationMinutes - Minutes until expiration (default: 30)
   */
  scheduleExpiration(transactionId, expirationMinutes = 30) {
    // Clear any existing timer for this booking
    if (this.activeTimers.has(transactionId)) {
      clearTimeout(this.activeTimers.get(transactionId));
    }

    const expirationMs = expirationMinutes * 60 * 1000; // Convert to milliseconds

    console.log(`⏰ Scheduling expiration for booking ${transactionId} in ${expirationMinutes} minutes`);

    const timeoutId = setTimeout(async () => {
      await this.expireBooking(transactionId);
      this.activeTimers.delete(transactionId);
    }, expirationMs);

    this.activeTimers.set(transactionId, timeoutId);
  }

  /**
   * Cancel scheduled expiration (called when payment is completed)
   * @param {string} transactionId - Booking transaction ID
   */
  cancelExpiration(transactionId) {
    if (this.activeTimers.has(transactionId)) {
      clearTimeout(this.activeTimers.get(transactionId));
      this.activeTimers.delete(transactionId);
      console.log(`✅ Cancelled expiration timer for booking ${transactionId}`);
    }
  }

  /**
   * Expire a specific booking
   * @param {string} transactionId - Booking transaction ID
   */
  async expireBooking(transactionId) {
    const client = await pool.connect();

    try {
      console.log(`🧹 Expiring booking: ${transactionId}`);

      await client.query('BEGIN');

      // Get booking details
      const bookingResult = await client.query(
        `SELECT b.*, t.name as train_name 
         FROM bookings b
         LEFT JOIN trains t ON b.train_id = t.id
         WHERE b.transaction_id = $1`,
        [transactionId]
      );

      if (bookingResult.rows.length === 0) {
        console.log(`⚠️  Booking ${transactionId} not found`);
        await client.query('ROLLBACK');
        return;
      }

      const booking = bookingResult.rows[0];

      // Only expire if still pending
      if (booking.status !== 'pending') {
        console.log(`⚠️  Booking ${transactionId} is not pending (status: ${booking.status}), skipping expiration`);
        await client.query('ROLLBACK');
        return;
      }

      // Update booking status to 'expired'
      await client.query(
        `UPDATE bookings 
         SET status = 'expired', updated_at = NOW()
         WHERE transaction_id = $1`,
        [transactionId]
      );

      // Update payment status to 'expired'
      await client.query(
        `UPDATE payments 
         SET status = 'expired', updated_at = NOW()
         WHERE transaction_id = $1`,
        [transactionId]
      );

      // Restore train seat
      await client.query(
        `UPDATE trains 
         SET available_seats = available_seats + 1, updated_at = NOW()
         WHERE id = $1`,
        [booking.train_id]
      );

      // Create notifications for user
      const bookingNotification = await Notification.create({
        notifiableType: 'booking',
        notifiableId: booking.id,
        type: 'booking.expired',
        data: {
          user_uuid: booking.user_uuid,
          transaction_id: transactionId,
          train_name: booking.train_name,
          message: 'Booking expired due to unpaid payment within 30 minutes',
          triggered_by: 'system'
        }
      }, client);

      const paymentNotification = await Notification.create({
        notifiableType: 'payment',
        notifiableId: booking.id,
        type: 'payment.expired',
        data: {
          user_uuid: booking.user_uuid,
          transaction_id: transactionId,
          message: 'Payment window expired (30 minutes)',
          triggered_by: 'system'
        }
      }, client);

      await client.query('COMMIT');

      console.log(`✅ Booking ${transactionId} expired successfully`);

      // Broadcast notifications via SSE
      try {
        const { broadcastToUser } = await import('../routes/notificationStreamRoutes.js');
        broadcastToUser(booking.user_uuid, [bookingNotification, paymentNotification]);
        console.log(`🔔 Expiration notifications sent to user ${booking.user_uuid}`);
      } catch (error) {
        console.error('⚠️  Failed to broadcast expiration notifications:', error);
      }

      // Broadcast to admins
      try {
        const { broadcastToAdmins } = await import('../routes/adminStreamRoutes.js');
        broadcastToAdmins('booking.expired', {
          transaction_id: transactionId,
          booking_code: booking.booking_code,
          expired_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('⚠️  Failed to broadcast to admins:', error);
      }

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error expiring booking ${transactionId}:`, error);
    } finally {
      client.release();
    }
  }

  /**
   * Restore active timers on server restart
   * Checks for pending bookings and reschedules their expiration
   */
  async restoreTimers() {
    const client = await pool.connect();

    try {
      console.log('🔄 Restoring booking expiration timers...');

      // Find all pending bookings
      const result = await client.query(
        `SELECT transaction_id, created_at 
         FROM bookings 
         WHERE status = 'pending'`
      );

      const now = new Date();

      for (const booking of result.rows) {
        const createdAt = new Date(booking.created_at);
        const elapsedMinutes = (now - createdAt) / (1000 * 60);
        const remainingMinutes = 30 - elapsedMinutes;

        if (remainingMinutes <= 0) {
          // Already expired, expire immediately
          console.log(`⚠️  Booking ${booking.transaction_id} already expired, expiring now`);
          await this.expireBooking(booking.transaction_id);
        } else {
          // Schedule remaining time
          console.log(`⏰ Restoring timer for ${booking.transaction_id}, ${remainingMinutes.toFixed(1)} minutes remaining`);
          this.scheduleExpiration(booking.transaction_id, remainingMinutes);
        }
      }

      console.log(`✅ Restored ${result.rows.length} booking timers`);

    } catch (error) {
      console.error('❌ Error restoring timers:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Get count of active timers
   */
  getActiveTimerCount() {
    return this.activeTimers.size;
  }
}

// Export singleton instance
export default new BookingExpirationService();
