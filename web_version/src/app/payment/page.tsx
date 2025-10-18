'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TripSummaryCard from '@/components/TripSummaryCard';
import { bookingService, paymentService } from '@/utils/api';
import { Train } from '@/types';
import { formatCurrency } from '@/utils/format';
import PaymentSkeleton from '@/components/skeletons/PaymentSkeleton';
import TransactionIdDisplay from '@/components/payment/TransactionIdDisplay';
import PaymentInstructions from '@/components/payment/PaymentInstructions';
import PaymentErrorDisplay from '@/components/payment/PaymentErrorDisplay';
import PaymentActionButtons from '@/components/payment/PaymentActionButtons';
import ExistingPaymentDetails from '@/components/payment/ExistingPaymentDetails';
import QrCodeDisplay from '@/components/payment/QrCodeDisplay';

// Extend Window interface for Midtrans Snap
declare global {
  interface Window {
    snap: any;
  }
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [train, setTrain] = useState<Train | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingPayment, setExistingPayment] = useState<any>(null);
  const [useQrPayment, setUseQrPayment] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        const bookingId = searchParams.get('bookingId');
        
        if (bookingId) {
          // Load from booking history via transaction ID
          const user = localStorage.getItem('user');
          if (!user) {
            router.push('/login');
            return;
          }
          
          const userData = JSON.parse(user);
          const bookingHistory = await bookingService.getBookingHistory(userData.uuid || userData.id);
          
          // Find the booking by transaction_id
          const foundBooking = bookingHistory.find((b: any) => b.transaction_id === bookingId);
          if (!foundBooking) {
            setError('Booking tidak ditemukan');
            setIsLoading(false);
            return;
          }          console.log('Found booking from history:', foundBooking);
          setBooking(foundBooking);
          if (foundBooking.train) {
            setTrain(foundBooking.train);
          }
        } else {
          // Load from sessionStorage (new booking flow)
          const storedBooking = sessionStorage.getItem('currentBooking');
          const storedTrain = sessionStorage.getItem('selectedTrain');
          
          if (!storedBooking || !storedTrain) {
            router.push('/schedule');
            return;
          }
          
          const parsedBooking = JSON.parse(storedBooking);
          const parsedTrain = JSON.parse(storedTrain);
            console.log('Loaded booking from sessionStorage:', parsedBooking);
          console.log('Loaded train from sessionStorage:', parsedTrain);
          console.log('Transaction ID from booking:', parsedBooking.transaction_id);
          console.log('Available booking keys:', Object.keys(parsedBooking));
          
          setBooking(parsedBooking);
          setTrain(parsedTrain);
        }
      } catch (error) {
        console.error('Error loading booking data:', error);
        setError('Gagal memuat data pemesanan');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [router, searchParams]);// Process payment with Midtrans
  const handleConfirmPayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        setError('Anda belum login. Silakan login terlebih dahulu.');
        setIsProcessing(false);
        return;
      }
        const transactionId = booking.transaction_id || booking.transactionId || booking.id;
      if (!transactionId) {
        setError('ID transaksi tidak ditemukan. Silakan coba lagi.');
        setIsProcessing(false);
        return;
      }

      console.log('🔷 Creating Midtrans payment for transaction:', transactionId);
      console.log('📱 Use QR Payment:', useQrPayment);
      
      // Create Midtrans payment transaction
      const paymentResponse = await paymentService.createPayment(transactionId, useQrPayment);
      
      // Handle QR payment response (Core API)
      if (paymentResponse.use_core_api && paymentResponse.qr_code_url) {
        console.log('💳 QR Payment created:', paymentResponse);
        setQrCodeData({
          qr_code_url: paymentResponse.qr_code_url,
          deeplink: paymentResponse.deeplink,
          expiry_time: paymentResponse.expiry_time,
          payment_type: paymentResponse.payment_type
        });
        setIsProcessing(false);
        return;
      }
      
      // Handle existing pending payment - show payment details
      if (paymentResponse.existing_payment) {
        console.log('💳 Existing payment found:', paymentResponse);
        
        // Check if it has stored QR data
        if (paymentResponse.payment_data?.qr_code_url) {
          console.log('💳 Existing QR payment found with stored QR code');
          setQrCodeData({
            qr_code_url: paymentResponse.payment_data.qr_code_url,
            deeplink: paymentResponse.payment_data.deeplink,
            expiry_time: paymentResponse.payment_data.expiry_time,
            payment_type: paymentResponse.payment_data.payment_type
          });
          setIsProcessing(false);
          return;
        }
        
        // Otherwise show existing payment modal (for VA, Store, etc.)
        setExistingPayment(paymentResponse);
        setIsProcessing(false);
        return;
      }
      
      if (!paymentResponse.snap_token) {
        throw new Error('Snap token tidak ditemukan');
      }

      console.log('✅ Snap token received:', paymentResponse.snap_token);

      // Check if Snap is loaded
      if (!window.snap) {
        throw new Error('Midtrans Snap belum dimuat. Silakan refresh halaman.');
      }

      // Open Midtrans Snap payment popup
      window.snap.pay(paymentResponse.snap_token, {
        onSuccess: function(result: any) {
          console.log('✅ Payment success:', result);
          // Navigate to success page
          router.push(`/payment-success?order_id=${transactionId}`);
        },
        onPending: function(result: any) {
          console.log('⏳ Payment pending:', result);
          setError('Pembayaran sedang diproses. Silakan selesaikan pembayaran Anda.');
          setIsProcessing(false);
        },
        onError: function(result: any) {
          console.error('❌ Payment error:', result);
          setError('Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.');
          setIsProcessing(false);
        },
        onClose: function() {
          console.log('⚠️ Payment popup closed');
          setError('Anda menutup jendela pembayaran. Silakan lanjutkan pembayaran untuk menyelesaikan pesanan.');
          setIsProcessing(false);
        }
      });

    } catch (error: any) {
      console.error('❌ Payment error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Gagal memproses pembayaran';
      const responseStatus = error.response?.data?.status;
      const errorType = error.response?.data?.error;
      const paymentType = error.response?.data?.payment_type;
      
      // Handle different error cases
      if (responseStatus === 'paid') {
        // Payment already completed
        setError('Pembayaran untuk transaksi ini sudah berhasil. Anda akan diarahkan ke halaman sukses...');
        setTimeout(() => {
          router.push(`/payment-success?order_id=${booking.transaction_id || booking.transactionId || booking.id}`);
        }, 2000);
      } else if (errorType === 'payment_session_expired') {
        // QR/deeplink expired for QRIS/GoPay/ShopeePay
        const paymentName = paymentType === 'qris' ? 'QRIS' : 
                           paymentType === 'gopay' ? 'GoPay' : 
                           paymentType === 'shopeepay' ? 'ShopeePay' : paymentType;
        setError(`⏰ Sesi pembayaran ${paymentName} telah expired. QR Code/link pembayaran hanya berlaku beberapa menit. Silakan refresh halaman (F5) untuk membuat pembayaran baru.`);
      } else if (errorMessage.includes('already been taken') || errorMessage.includes('order_id')) {
        // Duplicate order_id - this shouldn't happen with our new logic, but just in case
        setError('Terjadi kesalahan teknis. Silakan refresh halaman dan coba lagi.');
      } else if (errorMessage.includes('cancel') || errorMessage.includes('expire') || errorMessage.includes('deny')) {
        // Previous payment was cancelled/expired
        setError('Pembayaran sebelumnya telah dibatalkan atau expired. Silakan refresh halaman untuk membuat pembayaran baru.');
      } else {
        setError(`Gagal memproses pembayaran: ${errorMessage}. Silakan coba lagi.`);
      }
      setIsProcessing(false);
    }
  };

  const handleOrderOtherTicket = () => {
    router.push('/schedule');
  };

  const handleDownloadTicket = () => {
    // Placeholder for download functionality
    alert('Fitur download tiket akan segera tersedia');
  };

  if (isLoading || !booking || !train) {
    return <PaymentSkeleton />;
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-white drop-shadow-lg">
          Pembayaran Tiket
        </h1>
          {/* Booking Summary */}
        <TripSummaryCard 
          train={train} 
          travelDate={booking.travel_date || (typeof window !== 'undefined' && sessionStorage.getItem('travelDate')) || new Date().toISOString()}
          selectedSeat={booking.seat_number || (typeof window !== 'undefined' && sessionStorage.getItem('selectedSeat')) || 'N/A'}
          showSeat={true}
          className="mb-8"
        />        
        {/* Transaction ID - separate card */}
        <TransactionIdDisplay 
          transactionId={booking.transaction_id || booking.transactionId || booking.id || ''}
        />

        {/* QR Payment Mode Toggle */}
        <div className="mb-6 p-6 bg-white rounded-xl shadow-md">
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              id="qr-payment-toggle"
              checked={useQrPayment}
              onChange={(e) => setUseQrPayment(e.target.checked)}
              className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="qr-payment-toggle" className="flex-1 cursor-pointer">
              <div className="font-semibold text-gray-800 text-lg mb-1">
                🔷 Gunakan QR Code (QRIS/GoPay/ShopeePay)
              </div>
              <p className="text-sm text-gray-600">
                QR Code akan ditampilkan langsung di halaman ini tanpa popup. 
                Anda dapat menutup dan membuka kembali QR code kapan saja.
              </p>
              {useQrPayment && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    ℹ️ <span className="font-semibold">Catatan:</span> QR Code akan berlaku selama 15 menit. 
                    Pastikan untuk menyelesaikan pembayaran sebelum waktu habis.
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Payment Instructions */}
        <PaymentInstructions
          transactionId={booking.transaction_id || booking.transactionId || booking.id || ''}
          totalAmount={formatCurrency(
            Number(
              booking.total_price || 
              booking.price || 
              (typeof train.price === 'string' ? train.price.replace(/[^0-9]/g, '') : train.price) || 
              0
            )
          )}
        />

        {/* Error Display */}
        {error && <PaymentErrorDisplay error={error} />}

        {/* Existing Payment Details Modal */}
        {existingPayment && (
          <ExistingPaymentDetails
            paymentData={existingPayment}
            onClose={() => setExistingPayment(null)}
          />
        )}

        {/* QR Code Display Modal */}
        {qrCodeData && (
          <QrCodeDisplay
            qrCodeUrl={qrCodeData.qr_code_url}
            deeplink={qrCodeData.deeplink}
            expiryTime={qrCodeData.expiry_time}
            paymentType={qrCodeData.payment_type || 'qris'}
            onClose={() => setQrCodeData(null)}
          />
        )}

        {/* Action Buttons - Flutter Style */}
        <PaymentActionButtons
          isProcessing={isProcessing}
          onConfirmPayment={handleConfirmPayment}
          onOrderOtherTicket={handleOrderOtherTicket}
          onDownloadTicket={handleDownloadTicket}
        />
      </div>
  </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentSkeleton />}>
      <PaymentPageContent />
    </Suspense>
  );
}