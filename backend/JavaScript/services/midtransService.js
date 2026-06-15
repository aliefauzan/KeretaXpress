import axios from 'axios';
import crypto from 'crypto';

class MidtransService {
  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY;
    this.clientKey = process.env.MIDTRANS_CLIENT_KEY;
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    
    // Set base URL based on environment
    this.baseUrl = this.isProduction 
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1';
    
    // Create basic auth header
    this.authHeader = 'Basic ' + Buffer.from(this.serverKey + ':').toString('base64');
  }

  /**
   * Create Snap transaction token
   * @param {Object} transactionDetails - Transaction details
   * @returns {Promise<Object>} - Snap token and redirect URL
   */
  async createTransaction(transactionDetails) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transactions`,
        transactionDetails,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': this.authHeader
          }
        }
      );

      // Log full response to see what Midtrans actually returns
      console.log('Midtrans Snap Response:', JSON.stringify(response.data, null, 2));

      // Return all response data (Snap API only returns token and redirect_url)
      return {
        token: response.data.token,
        redirect_url: response.data.redirect_url,
        // Include any additional fields that might be present
        ...response.data
      };
    } catch (error) {
      console.error('Midtrans create transaction error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error_messages?.[0] || 'Failed to create payment transaction');
    }
  }

  /**
   * Create Core API transaction (for QRIS/GoPay with QR code URL)
   * @param {Object} transactionDetails - Transaction details
   * @param {string} paymentType - Payment type (gopay, shopeepay, qris)
   * @returns {Promise<Object>} - Transaction response with actions (QR code URL, deeplink)
   */
  async createCoreApiTransaction(transactionDetails, paymentType = 'gopay') {
    try {
      const coreApiUrl = this.isProduction
        ? 'https://api.midtrans.com/v2/charge'
        : 'https://api.sandbox.midtrans.com/v2/charge';

      const payload = {
        payment_type: paymentType,
        transaction_details: transactionDetails.transaction_details,
        customer_details: transactionDetails.customer_details,
        item_details: transactionDetails.item_details
      };

      // Add payment-specific options
      if (paymentType === 'gopay') {
        payload.gopay = {
          enable_callback: true,
          callback_url: transactionDetails.callbacks?.finish || `${process.env.CORS_ORIGIN}/payment-success`
        };
      } else if (paymentType === 'shopeepay') {
        payload.shopeepay = {
          callback_url: transactionDetails.callbacks?.finish || `${process.env.CORS_ORIGIN}/payment-success`
        };
      }

      const response = await axios.post(coreApiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this.authHeader
        }
      });

      console.log('Midtrans Core API Response:', JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error) {
      console.error('Midtrans Core API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error_messages?.[0] || 'Failed to create Core API transaction');
    }
  }

  /**
   * Get transaction status from Midtrans
   * @param {string} orderId - Order/Transaction ID
   * @returns {Promise<Object>} - Transaction status
   */
  async getTransactionStatus(orderId) {
    try {
      const statusUrl = this.isProduction
        ? 'https://api.midtrans.com/v2'
        : 'https://api.sandbox.midtrans.com/v2';

      const response = await axios.get(
        `${statusUrl}/${orderId}/status`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': this.authHeader
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Midtrans get status error:', error.response?.data || error.message);
      throw new Error('Failed to get transaction status');
    }
  }

  /**
   * Verify notification signature from Midtrans webhook
   * @param {Object} notification - Notification data from Midtrans
   * @returns {boolean} - Is signature valid
   */
  verifySignature(notification) {
    const { order_id, status_code, gross_amount, signature_key } = notification;
    
    // Create signature hash
    const hash = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${this.serverKey}`)
      .digest('hex');
    
    return hash === signature_key;
  }

  /**
   * Map Midtrans transaction status to our booking status
   * @param {string} transactionStatus - Midtrans transaction status
   * @param {string} fraudStatus - Midtrans fraud status
   * @returns {string} - Our booking status
   */
  mapTransactionStatus(transactionStatus, fraudStatus) {
    // Midtrans transaction status mapping
    // https://docs.midtrans.com/en/after-payment/http-notification
    
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        return 'paid';
      } else if (fraudStatus === 'challenge') {
        return 'pending';
      }
    } else if (transactionStatus === 'settlement') {
      return 'paid';
    } else if (transactionStatus === 'pending') {
      return 'pending';
    } else if (transactionStatus === 'deny' || transactionStatus === 'expire' || transactionStatus === 'cancel') {
      return 'cancelled';
    }
    
    return 'pending';
  }

  /**
   * Build transaction details for Snap
   * @param {Object} booking - Booking data
   * @param {Object} user - User data
   * @returns {Object} - Snap transaction payload
   */
  buildTransactionPayload(booking, user) {
    return {
      transaction_details: {
        order_id: booking.transaction_id,
        gross_amount: parseInt(booking.total_price)
      },
      customer_details: {
        first_name: user.name.split(' ')[0] || user.name,
        last_name: user.name.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: user.phone || ''
      },
      item_details: [
        {
          id: booking.train_id.toString(),
          price: parseInt(booking.total_price),
          quantity: 1,
          name: `${booking.departure_station} → ${booking.arrival_station}`,
          category: 'Train Ticket'
        }
      ],
      callbacks: {
        finish: `${process.env.CORS_ORIGIN}/payment-success?order_id=${booking.transaction_id}`,
        error: `${process.env.CORS_ORIGIN}/payment?order_id=${booking.transaction_id}`,
        pending: `${process.env.CORS_ORIGIN}/payment?order_id=${booking.transaction_id}`
      },
      expiry: {
        unit: 'hours',
        duration: 24
      }
    };
  }
}

export default new MidtransService();
