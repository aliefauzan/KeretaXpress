import pool from '../config/database.js';
import Notification from '../models/Notification.js';

class BookingCleanupService {
  /**
   * Cleanup expired bookings
   * Finds bookings that are still 'pending' but created more than 24 hours ago
   * Updates their status to 'expired' and creates notifications
   */
  static async cleanupExpiredBookings() {
    const client = await pool.connect();
    
    try {
      console.log('🧹 Starting booking cleanup service...');
      
      await client.query('BEGIN');

      // Find expired bookings (pending for more than 24 hours)
      const expiredBookingsQuery = `
        SELECT 
          b.*,
          t.name as train_name
        FROM bookings b
        LEFT JOIN trains t ON b.train_id = t.id
        WHERE b.status = 'pending'
        AND b.created_at < NOW() - INTERVAL '24 hours'
      `;

      const result = await client.query(expiredBookingsQuery);
      const expiredBookings = result.rows;

      if (expiredBookings.length === 0) {
        console.log('✅ No expired bookings found.');
        await client.query('COMMIT');
        return { success: true, count: 0, message: 'No expired bookings' };
      }

      console.log(`📋 Found ${expiredBookings.length} expired booking(s) to process.`);

      let successCount = 0;
      let failCount = 0;

      // Process each expired booking
      for (const booking of expiredBookings) {
        try {
          // Update booking status to expired
          await client.query(
            `UPDATE bookings 
             SET status = 'expired', updated_at = NOW()
             WHERE id = $1`,
            [booking.id]
          );

          // Update payment status to expired (if exists)
          await client.query(
            `UPDATE payments 
             SET status = 'expired', updated_at = NOW()
             WHERE transaction_id = $1`,
            [booking.transaction_id]
          );

          // Increment available seats back
          await client.query(
            `UPDATE trains 
             SET available_seats = available_seats + 1, updated_at = NOW()
             WHERE id = $1`,
            [booking.train_id]
          );

          // Create booking expired notification
          await Notification.create({
            type: 'booking.expired',
            notifiableType: 'booking',
            notifiableId: booking.id,
            data: {
              user_uuid: booking.user_uuid,
              transaction_id: booking.transaction_id,
              booking_code: booking.booking_code,
              title: 'Booking Kadaluarsa',
              message: `Booking ${booking.booking_code} telah kadaluarsa karena belum dibayar dalam 24 jam.`,
              triggered_by: 'system',
              expired_at: new Date().toISOString(),
              expiry_reason: '24 hour timeout exceeded'
            }
          });

          // Create payment expired notification
          await Notification.create({
            type: 'payment.expired',
            notifiableType: 'payment',
            notifiableId: booking.id,
            data: {
              user_uuid: booking.user_uuid,
              transaction_id: booking.transaction_id,
              booking_code: booking.booking_code,
              title: 'Pembayaran Kadaluarsa',
              message: `Waktu pembayaran untuk booking ${booking.booking_code} telah habis. Silakan buat booking baru.`,
              triggered_by: 'system',
              expired_at: new Date().toISOString()
            }
          });

          console.log(`   ✅ Expired booking ${booking.booking_code} (${booking.transaction_id})`);
          successCount++;

        } catch (bookingError) {
          console.error(`   ❌ Error processing booking ${booking.booking_code}:`, bookingError);
          failCount++;
        }
      }

      await client.query('COMMIT');

      console.log(`🎉 Cleanup complete: ${successCount} bookings expired, ${failCount} failed.`);

      return {
        success: true,
        count: successCount,
        failed: failCount,
        message: `Cleanup complete: ${successCount} bookings expired${failCount > 0 ? `, ${failCount} failed` : ''}`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Booking cleanup service error:', error);
      
      return {
        success: false,
        count: 0,
        error: error.message,
        message: 'Cleanup failed'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get statistics about pending bookings
   */
  static async getPendingBookingsStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_pending,
          COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '24 hours') as expired_count,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as active_pending
        FROM bookings
        WHERE status = 'pending'
      `;

      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting pending bookings stats:', error);
      return null;
    }
  }
}

export default BookingCleanupService;
