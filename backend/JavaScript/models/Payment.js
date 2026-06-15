import pool from '../config/database.js';

class Payment {
  /**
   * Create a new payment record
   */
  static async create(paymentData, client = pool) {
    try {
      const {
        bookingId,
        amount,
        paymentMethod,
        paymentType,
        status = 'pending',
        paymentData: data = null,
        orderId = null,
        paidAt = null,
        expiredAt = null
      } = paymentData;

      const result = await client.query(
        `INSERT INTO payments (
          booking_id, payment_type, payment_method, amount, status,
          order_id, payment_data, paid_at, expired_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          bookingId, paymentType, paymentMethod, amount, status,
          orderId, data ? JSON.stringify(data) : null, paidAt, expiredAt
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find payment by transaction ID (from bookings table)
   */
  static async findByTransactionId(transactionId) {
    try {
      const result = await pool.query(
        `SELECT p.*, 
                b.transaction_id, b.user_uuid, b.travel_date, b.passenger_name,
                json_build_object(
                  'id', b.id,
                  'transaction_id', b.transaction_id,
                  'user_uuid', b.user_uuid,
                  'status', b.status,
                  'travel_date', b.travel_date,
                  'passenger_name', b.passenger_name
                ) as booking
         FROM payments p
         JOIN bookings b ON p.booking_id = b.id
         WHERE b.transaction_id = $1
         ORDER BY p.created_at DESC LIMIT 1`,
        [transactionId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find payment by order ID (Midtrans order_id, same as transaction_id)
   */
  static async findByOrderId(orderId) {
    try {
      const result = await pool.query(
        `SELECT p.*, 
                b.transaction_id, b.user_uuid, b.travel_date, b.passenger_name
         FROM payments p
         JOIN bookings b ON p.booking_id = b.id
         WHERE p.order_id = $1
         ORDER BY p.created_at DESC LIMIT 1`,
        [orderId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find payment by booking ID
   */
  static async findByBookingId(bookingId) {
    try {
      const result = await pool.query(
        `SELECT p.*, b.transaction_id, b.user_uuid
         FROM payments p
         JOIN bookings b ON p.booking_id = b.id
         WHERE p.booking_id = $1 
         ORDER BY p.created_at DESC LIMIT 1`,
        [bookingId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all payments for a booking (payment attempts)
   */
  static async getAllByBookingId(bookingId) {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC',
        [bookingId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update payment status by order_id (Midtrans uses order_id)
   */
  static async updateStatus(orderId, status, paidAt = null) {
    try {
      const updateFields = paidAt 
        ? `status = $1, paid_at = $2, updated_at = NOW()`
        : `status = $1, updated_at = NOW()`;
      
      const params = paidAt ? [status, paidAt, orderId] : [status, orderId];
      
      const result = await pool.query(
        `UPDATE payments 
         SET ${updateFields}
         WHERE order_id = $${paidAt ? '3' : '2'}
         RETURNING *`,
        params
      );
      
      // Also update booking status if payment is successful
      if (status === 'success' || status === 'settlement') {
        await pool.query(
          `UPDATE bookings b
           SET status = 'paid', updated_at = NOW()
           FROM payments p
           WHERE p.booking_id = b.id AND p.order_id = $1`,
          [orderId]
        );
      }
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update payment data (Midtrans response, QR URLs, etc.)
   */
  static async updatePaymentData(orderId, paymentData) {
    try {
      const result = await pool.query(
        `UPDATE payments 
         SET payment_data = $1, updated_at = NOW()
         WHERE order_id = $2
         RETURNING *`,
        [JSON.stringify(paymentData), orderId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pending payments (for cleanup/expiry checking)
   */
  static async getPending(limit = 100) {
    try {
      const result = await pool.query(
        `SELECT * FROM payments 
         WHERE status = 'pending'
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get expired payments that need to be marked as expired
   */
  static async getExpiredPending() {
    try {
      const result = await pool.query(
        `SELECT * FROM payments 
         WHERE status = 'pending'
           AND expired_at IS NOT NULL
           AND expired_at < NOW()
         ORDER BY created_at DESC`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  static async getStats(startDate = null, endDate = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_payments,
          COUNT(CASE WHEN status IN ('settlement', 'success') THEN 1 END) as successful_payments,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN status IN ('failed', 'expired', 'cancelled') THEN 1 END) as failed_payments,
          SUM(CASE WHEN status IN ('settlement', 'success') THEN amount ELSE 0 END) as total_revenue,
          AVG(CASE WHEN status IN ('settlement', 'success') THEN amount ELSE NULL END) as avg_payment_amount,
          payment_method,
          COUNT(*) as count_by_method
        FROM payments
      `;

      const params = [];
      if (startDate && endDate) {
        query += ' WHERE created_at BETWEEN $1 AND $2';
        params.push(startDate, endDate);
      }

      query += ' GROUP BY payment_method';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel payment
   */
  static async cancel(orderId, reason = null) {
    try {
      const result = await pool.query(
        `UPDATE payments 
         SET status = 'cancelled', 
             payment_data = COALESCE(payment_data, '{}'::jsonb) || $2::jsonb,
             updated_at = NOW()
         WHERE order_id = $1
         RETURNING *`,
        [orderId, reason ? JSON.stringify({ cancellation_reason: reason }) : '{}']
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default Payment;
