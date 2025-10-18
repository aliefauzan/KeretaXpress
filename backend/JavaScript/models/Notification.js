import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class Notification {
  /**
   * Create a new notification
   * @param {Object} notificationData
   * @param {string} notificationData.type - Notification type (e.g., 'payment_success', 'trip_reminder_24h')
   * @param {string} notificationData.notifiableType - 'user' or 'admin'
   * @param {number} notificationData.notifiableId - User ID or Admin ID
   * @param {Object} notificationData.data - Notification content (title, message, etc.)
   */
  static async create({ type, notifiableType, notifiableId, data }) {
    try {
      const uuid = uuidv4();
      
      const result = await pool.query(
        `INSERT INTO notifications (uuid, type, notifiable_type, notifiable_id, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [uuid, type, notifiableType, notifiableId, JSON.stringify(data)]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get notifications for a user or admin
   */
  static async getForUser(notifiableType, notifiableId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications
         WHERE notifiable_type = $1 AND notifiable_id = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [notifiableType, notifiableId, limit]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get unread notifications
   */
  static async getUnread(notifiableType, notifiableId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications
         WHERE notifiable_type = $1 
           AND notifiable_id = $2
           AND read_at IS NULL
         ORDER BY created_at DESC
         LIMIT $3`,
        [notifiableType, notifiableId, limit]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(notifiableType, notifiableId) {
    try {
      const result = await pool.query(
        `SELECT get_unread_notifications_count($1, $2) as count`,
        [notifiableType, notifiableId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    try {
      await pool.query(
        `SELECT mark_notification_as_read($1)`,
        [notificationId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(notifiableType, notifiableId) {
    try {
      const result = await pool.query(
        `SELECT mark_all_notifications_as_read($1, $2) as count`,
        [notifiableType, notifiableId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async delete(notificationId) {
    try {
      await pool.query(
        `DELETE FROM notifications WHERE id = $1`,
        [notificationId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Helper: Send payment success notification
   */
  static async sendPaymentSuccess(userId, { transactionId, amount, bookingId }) {
    return await this.create({
      type: 'payment_success',
      notifiableType: 'user',
      notifiableId: userId,
      data: {
        title: 'Payment Successful! 🎉',
        message: `Your payment of Rp ${amount.toLocaleString('id-ID')} has been confirmed.`,
        transaction_id: transactionId,
        amount: amount,
        icon: 'success',
        action_url: `/bookings/${transactionId}`,
        action_text: 'View Booking'
      }
    });
  }

  /**
   * Helper: Send trip reminder (24h before)
   */
  static async sendTripReminder24h(userId, { trainName, departureTime, departureStation, seatNumber, transactionId }) {
    return await this.create({
      type: 'trip_reminder_24h',
      notifiableType: 'user',
      notifiableId: userId,
      data: {
        title: 'Trip Tomorrow! 🚄',
        message: `Your train "${trainName}" departs tomorrow at ${new Date(departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`,
        train_name: trainName,
        departure_time: departureTime,
        departure_station: departureStation,
        seat_number: seatNumber,
        icon: 'info',
        action_url: `/bookings/${transactionId}`,
        action_text: 'View Details'
      }
    });
  }

  /**
   * Helper: Send trip reminder (2h before)
   */
  static async sendTripReminder2h(userId, { trainName, departureTime, transactionId }) {
    return await this.create({
      type: 'trip_reminder_2h',
      notifiableType: 'user',
      notifiableId: userId,
      data: {
        title: 'Boarding Soon! ⏰',
        message: `Your train "${trainName}" departs in 2 hours. Please arrive at the station early.`,
        train_name: trainName,
        departure_time: departureTime,
        icon: 'warning',
        action_url: `/bookings/${transactionId}`,
        action_text: 'View Ticket'
      }
    });
  }

  /**
   * Helper: Send booking cancelled notification
   */
  static async sendBookingCancelled(userId, { transactionId, refundAmount, reason }) {
    return await this.create({
      type: 'booking_cancelled',
      notifiableType: 'user',
      notifiableId: userId,
      data: {
        title: 'Booking Cancelled',
        message: `Your booking ${transactionId} has been cancelled.`,
        transaction_id: transactionId,
        refund_amount: refundAmount,
        reason: reason,
        icon: 'warning',
        action_url: `/bookings/${transactionId}`
      }
    });
  }

  /**
   * Helper: Send new booking notification to admin
   */
  static async sendNewBookingToAdmin(adminId, { customerName, transactionId, amount, trainName }) {
    return await this.create({
      type: 'new_booking',
      notifiableType: 'admin',
      notifiableId: adminId,
      data: {
        title: 'New Booking Created',
        message: `Customer ${customerName} booked ${trainName} for Rp ${amount.toLocaleString('id-ID')}.`,
        customer_name: customerName,
        transaction_id: transactionId,
        amount: amount,
        train_name: trainName,
        icon: 'info',
        action_url: `/admin/bookings/${transactionId}`
      }
    });
  }
}

export default Notification;
