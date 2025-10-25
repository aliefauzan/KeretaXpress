import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import supabaseService from '../services/supabaseService.js';
import midtransService from '../services/midtransService.js';

class PaymentController {
  // Create payment transaction with Midtrans
  static async createPayment(req, res) {
    try {
      const { transaction_id, use_qr_payment } = req.body;
      const user = req.user;

      if (!transaction_id) {
        return res.status(422).json({ 
          errors: {
            transaction_id: ['Transaction ID is required']
          }
        });
      }

      // Find booking
      const booking = await Booking.findByTransactionId(transaction_id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if booking belongs to user
      if (booking.user_uuid !== user.uuid) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Check if already paid
      if (booking.status === 'paid') {
        return res.status(400).json({ 
          message: 'Booking sudah terbayar',
          status: 'paid'
        });
      }

      // Check existing payment in our database
      let existingPayment = await Payment.findByTransactionId(transaction_id);
      
      // Check existing payment status from Midtrans
      let existingTransaction = null;
      
      try {
        existingTransaction = await midtransService.getTransactionStatus(transaction_id);
        console.log('📋 Existing transaction status:', existingTransaction.transaction_status);
        
        // If payment is settlement/capture (paid), update our DB and return
        if (existingTransaction.transaction_status === 'settlement' || 
            existingTransaction.transaction_status === 'capture') {
          await Booking.updateStatus(transaction_id, 'paid');
          if (existingPayment) {
            await Payment.updateStatus(transaction_id, 'success', new Date());
          }
          return res.status(400).json({ 
            message: 'Pembayaran sudah berhasil',
            status: 'paid'
          });
        }
        
        // If payment is PENDING, return existing details
        if (existingTransaction.transaction_status === 'pending') {
          console.log('✅ Payment is pending, returning existing payment details');
          
          // Parse stored payment_data if it exists
          let paymentData = null;
          if (existingPayment && existingPayment.payment_data) {
            try {
              paymentData = typeof existingPayment.payment_data === 'string' 
                ? JSON.parse(existingPayment.payment_data) 
                : existingPayment.payment_data;
            } catch (e) {
              console.error('Error parsing payment_data:', e);
            }
          }
          
          // Return existing payment information
          return res.status(200).json({
            transaction_id: transaction_id,
            snap_token: null,
            redirect_url: null,
            booking: booking,
            existing_payment: true,
            payment_type: existingTransaction.payment_type,
            payment_code: existingTransaction.payment_code,
            va_numbers: existingTransaction.va_numbers,
            bill_key: existingTransaction.bill_key,
            biller_code: existingTransaction.biller_code,
            permata_va_number: existingTransaction.permata_va_number,
            pdf_url: existingTransaction.pdf_url,
            transaction_time: existingTransaction.transaction_time,
            expiry_time: existingTransaction.expiry_time,
            midtrans_status: existingTransaction.transaction_status,
            payment_data: paymentData,
            message: 'Pembayaran sedang menunggu. Silakan selesaikan pembayaran Anda dengan metode yang sudah dipilih.'
          });
        }
        
        // If payment was denied/cancelled/expired, allow creating new payment
        if (existingTransaction.transaction_status === 'deny' || 
            existingTransaction.transaction_status === 'cancel' || 
            existingTransaction.transaction_status === 'expire') {
          console.log(`⚠️ Previous payment was ${existingTransaction.transaction_status}, will create new payment`);
          await Booking.updateStatus(transaction_id, 'cancelled');
          if (existingPayment) {
            await Payment.updateStatus(transaction_id, 'cancelled');
          }
        }
      } catch (error) {
        console.log('ℹ️ No existing transaction found in Midtrans, will create new one');
      }

      // Get full user data
      const userData = await User.findByUuid(user.uuid);

      // Build Midtrans transaction payload
      const transactionPayload = midtransService.buildTransactionPayload(
        booking, 
        userData
      );

      // Determine if we should use Core API for QR payments
      const shouldUseCoreApi = use_qr_payment === true;

      if (shouldUseCoreApi) {
        console.log('🔷 Using Core API for QR payment (QRIS/GoPay/ShopeePay)');
        
        const paymentType = 'qris'; 
        
        // Create transaction using Core API
        const coreApiResponse = await midtransService.createCoreApiTransaction(
          transactionPayload,
          paymentType
        );

        // Extract QR URL and deeplink from actions array
        let qrCodeUrl = null;
        let deeplink = null;
        
        if (coreApiResponse.actions) {
          const qrAction = coreApiResponse.actions.find(a => a.name === 'generate-qr-code');
          const deeplinkAction = coreApiResponse.actions.find(a => a.name === 'deeplink-redirect');
          
          qrCodeUrl = qrAction?.url;
          deeplink = deeplinkAction?.url;
        }

        // Store payment data in payments table
        const paymentDataToStore = {
          qr_code_url: qrCodeUrl,
          deeplink: deeplink,
          payment_type: coreApiResponse.payment_type,
          transaction_id: coreApiResponse.transaction_id,
          order_id: coreApiResponse.order_id,
          transaction_time: coreApiResponse.transaction_time,
          transaction_status: coreApiResponse.transaction_status,
          expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          actions: coreApiResponse.actions
        };

        // Create or update payment record
        if (existingPayment) {
          await Payment.updatePaymentData(transaction_id, paymentDataToStore);
        } else {
          await Payment.create({
            bookingId: booking.id,
            paymentType: paymentType,
            paymentMethod: paymentType,
            amount: booking.total_price,
            status: 'pending',
            orderId: transaction_id,
            paymentData: paymentDataToStore,
            expiredAt: paymentDataToStore.expiry_time
          });
        }
        
        console.log('✅ Stored payment data with QR URL in payments table');

        // Update booking status to pending
        await Booking.updateStatus(transaction_id, 'pending');

        return res.status(200).json({
          transaction_id: booking.transaction_id,
          snap_token: null,
          redirect_url: null,
          booking: booking,
          use_core_api: true,
          payment_type: paymentType,
          qr_code_url: qrCodeUrl,
          deeplink: deeplink,
          expiry_time: paymentDataToStore.expiry_time,
          message: 'Scan QR code atau klik deeplink untuk membayar'
        });
      }

      // For non-QR payments, use Snap API (Credit Card, VA, etc.)
      console.log('📱 Using Snap API for standard payment');
      const snapTransaction = await midtransService.createTransaction(transactionPayload);

      // Create payment record
      if (!existingPayment) {
        await Payment.create({
          bookingId: booking.id,
          paymentType: 'snap',
          paymentMethod: booking.payment_method || 'snap',
          amount: booking.total_price,
          status: 'pending',
          orderId: transaction_id,
          paymentData: { snap_token: snapTransaction.token }
        });
      }

      // Update booking status to pending
      await Booking.updateStatus(transaction_id, 'pending');

      return res.status(200).json({
        transaction_id: booking.transaction_id,
        snap_token: snapTransaction.token,
        redirect_url: snapTransaction.redirect_url,
        booking: booking
      });
    } catch (error) {
      console.error('Create payment error:', error);
      
      // Handle specific Midtrans errors
      if (error.message && error.message.includes('Transaction failed')) {
        return res.status(400).json({ 
          message: 'Payment transaction failed. Please try again.',
          error: error.message
        });
      }
      
      if (error.message && error.message.includes('order_id')) {
        return res.status(400).json({ 
          message: 'Invalid transaction ID format'
        });
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(503).json({ 
          message: 'Payment gateway is temporarily unavailable. Please try again later.'
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to create payment transaction. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Handle Midtrans notification webhook
  static async handleNotification(req, res) {
    try {
      const notification = req.body;
      
      console.log('📥 Midtrans notification received:', {
        order_id: notification.order_id,
        transaction_status: notification.transaction_status,
        fraud_status: notification.fraud_status
      });

      // Verify signature
      const isValidSignature = midtransService.verifySignature(notification);
      if (!isValidSignature) {
        console.error('❌ Invalid signature from Midtrans notification');
        return res.status(403).json({ message: 'Invalid signature' });
      }

      const { order_id, transaction_status, fraud_status } = notification;

      // Find booking
      const booking = await Booking.findByTransactionId(order_id);
      if (!booking) {
        console.error('❌ Booking not found:', order_id);
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Map Midtrans status to our status
      const newStatus = midtransService.mapTransactionStatus(transaction_status, fraud_status);
      
      // Determine paid_at timestamp
      const paidAt = (newStatus === 'success' || newStatus === 'settlement' || newStatus === 'paid') 
        ? new Date() 
        : null;

      // Update payment status in payments table
      const payment = await Payment.findByOrderId(order_id);
      if (payment) {
        await Payment.updateStatus(order_id, newStatus, paidAt);
      } else {
        // Create payment record if it doesn't exist (shouldn't happen but just in case)
        await Payment.create({
          bookingId: booking.id,
          paymentType: transaction_status === 'capture' ? 'credit_card' : 'other',
          paymentMethod: notification.payment_type || 'unknown',
          amount: booking.total_price,
          status: newStatus,
          orderId: order_id,
          paymentData: notification,
          paidAt: paidAt
        });
      }

      // Update booking status (only if payment is successful)
      if (paidAt) {
        await Booking.updateStatus(order_id, 'paid');
        
        // Create notifications for successful payment
        try {
          // Payment completed notification
          await Notification.create({
            type: 'payment.completed',
            notifiableType: 'payment',
            notifiableId: payment?.id || booking.id,
            data: {
              user_uuid: booking.user_uuid,
              transaction_id: order_id,
              booking_code: booking.booking_code,
              amount: booking.total_price,
              title: 'Pembayaran Berhasil',
              message: `Pembayaran untuk booking ${booking.booking_code} telah berhasil diproses.`,
              triggered_by: 'midtrans',
              payment_method: notification.payment_type
            }
          });

          // Booking confirmed notification
          await Notification.create({
            type: 'booking.confirmed',
            notifiableType: 'booking',
            notifiableId: booking.id,
            data: {
              user_uuid: booking.user_uuid,
              transaction_id: order_id,
              booking_code: booking.booking_code,
              seat_number: booking.seat_number,
              travel_date: booking.travel_date,
              title: 'Booking Dikonfirmasi',
              message: `Booking ${booking.booking_code} telah dikonfirmasi. Selamat menikmati perjalanan Anda!`,
              triggered_by: 'midtrans'
            }
          });

          console.log(`✅ Notifications created for successful payment: ${order_id}`);
        } catch (notifError) {
          console.error('⚠️  Failed to create notifications:', notifError);
          // Don't fail the webhook if notification creation fails
        }
      } else if (newStatus === 'cancelled' || newStatus === 'expired' || newStatus === 'failed') {
        await Booking.updateStatus(order_id, newStatus);
        
        // Create notifications for failed/cancelled/expired payment
        try {
          const notifType = newStatus === 'cancelled' ? 'payment.cancelled' : 
                           newStatus === 'expired' ? 'payment.expired' : 'payment.failed';
          const notifTitle = newStatus === 'cancelled' ? 'Pembayaran Dibatalkan' : 
                            newStatus === 'expired' ? 'Pembayaran Kadaluarsa' : 'Pembayaran Gagal';
          const notifMessage = newStatus === 'cancelled' 
            ? `Pembayaran untuk booking ${booking.booking_code} telah dibatalkan.`
            : newStatus === 'expired'
            ? `Pembayaran untuk booking ${booking.booking_code} telah kadaluarsa. Silakan buat booking baru.`
            : `Pembayaran untuk booking ${booking.booking_code} gagal diproses.`;

          await Notification.create({
            type: notifType,
            notifiableType: 'payment',
            notifiableId: payment?.id || booking.id,
            data: {
              user_uuid: booking.user_uuid,
              transaction_id: order_id,
              booking_code: booking.booking_code,
              title: notifTitle,
              message: notifMessage,
              triggered_by: 'midtrans',
              status: newStatus
            }
          });

          console.log(`✅ Notification created for ${newStatus} payment: ${order_id}`);
        } catch (notifError) {
          console.error('⚠️  Failed to create notification:', notifError);
        }
      }

      console.log(`✅ Payment ${order_id} status updated to: ${newStatus}`);

      return res.status(200).json({ 
        message: 'Notification processed successfully',
        order_id: order_id,
        status: newStatus
      });
    } catch (error) {
      console.error('❌ Handle notification error:', error);
      
      // Log but still return 200 to Midtrans to prevent retries
      return res.status(200).json({ 
        message: 'Notification received but processing failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Check payment status
  static async checkStatus(req, res) {
    try {
      const { transaction_id } = req.params;
      const user = req.user;

      // Find booking
      const booking = await Booking.findByTransactionId(transaction_id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if booking belongs to user
      if (booking.user_uuid !== user.uuid) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Get status from Midtrans
      const midtransStatus = await midtransService.getTransactionStatus(transaction_id);

      // Map status
      const newStatus = midtransService.mapTransactionStatus(
        midtransStatus.transaction_status,
        midtransStatus.fraud_status
      );
      
      // Determine paid_at
      const paidAt = (newStatus === 'success' || newStatus === 'settlement' || newStatus === 'paid') 
        ? new Date() 
        : null;

      // Update payment status if changed
      const payment = await Payment.findByOrderId(transaction_id);
      if (payment && payment.status !== newStatus) {
        await Payment.updateStatus(transaction_id, newStatus, paidAt);
      }

      // Update booking if status changed
      if (booking.status !== newStatus) {
        if (paidAt) {
          await Booking.updateStatus(transaction_id, 'paid');
        } else if (newStatus === 'cancelled' || newStatus === 'expired' || newStatus === 'failed') {
          await Booking.updateStatus(transaction_id, newStatus);
        }
      }

      return res.status(200).json({
        transaction_id: transaction_id,
        status: newStatus,
        midtrans_status: midtransStatus.transaction_status,
        payment_type: midtransStatus.payment_type,
        transaction_time: midtransStatus.transaction_time,
        payment: payment
      });
    } catch (error) {
      console.error('Check status error:', error);
      
      if (error.message && error.message.includes('404')) {
        return res.status(404).json({ 
          message: 'Transaction not found in payment gateway'
        });
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(503).json({ 
          message: 'Payment gateway is temporarily unavailable'
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to check payment status. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Get payment details for a transaction
  static async getPaymentDetails(req, res) {
    try {
      const { transaction_id } = req.params;
      const user = req.user;

      // Find booking
      const booking = await Booking.findByTransactionId(transaction_id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if booking belongs to user
      if (booking.user_uuid !== user.uuid) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Find payment record
      const payment = await Payment.findByTransactionId(transaction_id);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Parse payment_data if it's a string
      let paymentData = null;
      if (payment.payment_data) {
        try {
          paymentData = typeof payment.payment_data === 'string' 
            ? JSON.parse(payment.payment_data) 
            : payment.payment_data;
        } catch (e) {
          console.error('Error parsing payment_data:', e);
        }
      }

      return res.status(200).json({
        id: payment.id,
        booking_id: payment.booking_id,
        transaction_id: booking.transaction_id,
        payment_type: payment.payment_type,
        payment_method: payment.payment_method,
        amount: payment.amount,
        status: payment.status,
        order_id: payment.order_id,
        payment_data: paymentData,
        paid_at: payment.paid_at,
        expired_at: payment.expired_at,
        created_at: payment.created_at,
        updated_at: payment.updated_at
      });
    } catch (error) {
      console.error('Get payment details error:', error);
      
      if (error.code === '22P02') {
        return res.status(400).json({ 
          message: 'Invalid transaction ID format'
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to retrieve payment details. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default PaymentController;
