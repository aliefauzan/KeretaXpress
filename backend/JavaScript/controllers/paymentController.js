import Booking from '../models/Booking.js';
import User from '../models/User.js';
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

      // Check existing payment status from Midtrans
      let existingTransaction = null;
      
      try {
        existingTransaction = await midtransService.getTransactionStatus(transaction_id);
        console.log('📋 Existing transaction status:', existingTransaction.transaction_status);
        
        // If payment is settlement/capture (paid), update our DB and return
        if (existingTransaction.transaction_status === 'settlement' || 
            existingTransaction.transaction_status === 'capture') {
          await Booking.updateStatus(transaction_id, 'paid');
          return res.status(400).json({ 
            message: 'Pembayaran sudah berhasil',
            status: 'paid'
          });
        }
        
        // If payment is PENDING, return existing details (including stored QR if available)
        if (existingTransaction.transaction_status === 'pending') {
          const paymentType = existingTransaction.payment_type;
          
          console.log('✅ Payment is pending, returning existing payment details');
          
          // Parse stored payment_data if it exists
          let paymentData = null;
          if (booking.payment_data) {
            try {
              paymentData = typeof booking.payment_data === 'string' 
                ? JSON.parse(booking.payment_data) 
                : booking.payment_data;
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
            payment_data: paymentData, // Include stored QR URLs, deeplinks, etc.
            message: 'Pembayaran sedang menunggu. Silakan selesaikan pembayaran Anda dengan metode yang sudah dipilih.'
          });
        }
        
        // If payment was denied/cancelled/expired, allow creating new payment
        if (existingTransaction.transaction_status === 'deny' || 
            existingTransaction.transaction_status === 'cancel' || 
            existingTransaction.transaction_status === 'expire') {
          console.log(`⚠️ Previous payment was ${existingTransaction.transaction_status}, will create new payment`);
          await Booking.updateStatus(transaction_id, 'cancelled');
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
      // Core API is used for QRIS/GoPay/ShopeePay to get QR code URL
      const shouldUseCoreApi = use_qr_payment === true;

      if (shouldUseCoreApi) {
        console.log('🔷 Using Core API for QR payment (QRIS/GoPay/ShopeePay)');
        
        // Default to QRIS, but could be changed based on user selection
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

        // Store payment data in database for later retrieval
        const paymentDataToStore = {
          qr_code_url: qrCodeUrl,
          deeplink: deeplink,
          payment_type: coreApiResponse.payment_type,
          transaction_id: coreApiResponse.transaction_id,
          order_id: coreApiResponse.order_id,
          transaction_time: coreApiResponse.transaction_time,
          transaction_status: coreApiResponse.transaction_status,
          expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // QR expires in 15 minutes
          actions: coreApiResponse.actions
        };

        await Booking.updatePaymentData(transaction_id, paymentDataToStore);
        console.log('✅ Stored payment data with QR URL in database');

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
      return res.status(500).json({ 
        message: error.message || 'Failed to create payment transaction' 
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

      // Update booking status
      await Booking.updateStatus(order_id, newStatus);

      console.log(`✅ Booking ${order_id} status updated to: ${newStatus}`);

      return res.status(200).json({ 
        message: 'Notification processed successfully',
        order_id: order_id,
        status: newStatus
      });
    } catch (error) {
      console.error('❌ Handle notification error:', error);
      return res.status(500).json({ message: 'Internal server error' });
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

      // Update booking if status changed
      if (booking.status !== newStatus) {
        await Booking.updateStatus(transaction_id, newStatus);
      }

      return res.status(200).json({
        transaction_id: transaction_id,
        status: newStatus,
        midtrans_status: midtransStatus.transaction_status,
        payment_type: midtransStatus.payment_type,
        transaction_time: midtransStatus.transaction_time
      });
    } catch (error) {
      console.error('Check status error:', error);
      return res.status(500).json({ message: 'Failed to check payment status' });
    }
  }
}

export default PaymentController;
