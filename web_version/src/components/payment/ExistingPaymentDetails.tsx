import { FiCopy, FiClock, FiCheckCircle } from 'react-icons/fi';
import { useState } from 'react';

interface ExistingPaymentDetailsProps {
  paymentData: {
    payment_type?: string;
    va_numbers?: Array<{ bank: string; va_number: string }>;
    bill_key?: string;
    biller_code?: string;
    payment_code?: string;
    store?: string;
    expiry_time?: string;
    transaction_id?: string;
  };
  onClose?: () => void;
}

export default function ExistingPaymentDetails({ paymentData, onClose }: ExistingPaymentDetailsProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPaymentDetails = () => {
    const { payment_type, va_numbers, bill_key, biller_code, payment_code, store } = paymentData;

    // Virtual Account (BCA, BNI, BRI, etc)
    if (payment_type === 'bank_transfer' && va_numbers && va_numbers.length > 0) {
      const va = va_numbers[0];
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
            <h3 className="font-bold text-lg mb-3 text-blue-800 flex items-center">
              🏦 {va.bank.toUpperCase()} Virtual Account
            </h3>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Nomor Virtual Account</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900 tracking-wider">{va.va_number}</p>
                <button
                  onClick={() => copyToClipboard(va.va_number)}
                  className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Salin nomor"
                >
                  {copied ? (
                    <FiCheckCircle className="text-green-500" size={20} />
                  ) : (
                    <FiCopy className="text-gray-600" size={20} />
                  )}
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-700 space-y-2">
              <p>📝 <strong>Cara Pembayaran:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Buka aplikasi mobile banking atau ATM {va.bank.toUpperCase()}</li>
                <li>Pilih menu Transfer / Bayar</li>
                <li>Pilih Virtual Account</li>
                <li>Masukkan nomor VA di atas</li>
                <li>Konfirmasi pembayaran</li>
              </ol>
            </div>
          </div>
        </div>
      );
    }

    // Mandiri Bill Payment
    if (payment_type === 'echannel' && bill_key && biller_code) {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
            <h3 className="font-bold text-lg mb-3 text-blue-800 flex items-center">
              🏦 Mandiri Bill Payment
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Biller Code</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-gray-900">{biller_code}</p>
                  <button
                    onClick={() => copyToClipboard(biller_code)}
                    className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiCopy className="text-gray-600" size={18} />
                  </button>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Bill Key</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-gray-900">{bill_key}</p>
                  <button
                    onClick={() => copyToClipboard(bill_key)}
                    className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiCopy className="text-gray-600" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Convenience Store (Indomaret, Alfamart)
    if (payment_type === 'cstore' && payment_code) {
      return (
        <div className="space-y-4">
          <div className="bg-green-50 p-5 rounded-lg border border-green-200">
            <h3 className="font-bold text-lg mb-3 text-green-800 flex items-center">
              🏪 {store || 'Convenience Store'}
            </h3>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Kode Pembayaran</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900 tracking-wider">{payment_code}</p>
                <button
                  onClick={() => copyToClipboard(payment_code)}
                  className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied ? (
                    <FiCheckCircle className="text-green-500" size={20} />
                  ) : (
                    <FiCopy className="text-gray-600" size={20} />
                  )}
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-700">
              <p>📝 Tunjukkan kode di atas ke kasir {store} untuk menyelesaikan pembayaran.</p>
            </div>
          </div>
        </div>
      );
    }

    // QRIS
    if (payment_type === 'qris') {
      return (
        <div className="space-y-4">
          <div className="bg-red-50 p-5 rounded-lg border border-red-200">
            <h3 className="font-bold text-lg mb-3 text-red-800 flex items-center">
              ⚠️ QRIS - Sesi Expired
            </h3>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-gray-700 mb-3">
                QR Code QRIS hanya berlaku beberapa menit dan sudah tidak dapat digunakan.
              </p>
              <p className="text-sm text-gray-600">
                Silakan <strong>refresh halaman (tekan F5)</strong> untuk membuat pembayaran QRIS baru dengan QR Code yang baru.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // E-Wallet (GoPay, ShopeePay)
    if (payment_type === 'gopay' || payment_type === 'shopeepay') {
      return (
        <div className="space-y-4">
          <div className="bg-red-50 p-5 rounded-lg border border-red-200">
            <h3 className="font-bold text-lg mb-3 text-red-800 flex items-center">
              ⚠️ {payment_type === 'gopay' ? 'GoPay' : 'ShopeePay'} - Sesi Expired
            </h3>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-gray-700 mb-3">
                Link pembayaran {payment_type === 'gopay' ? 'GoPay' : 'ShopeePay'} sudah expired 
                dan tidak dapat digunakan lagi.
              </p>
              <p className="text-sm text-gray-600">
                Silakan <strong>refresh halaman (tekan F5)</strong> untuk membuat pembayaran baru.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Default
    return (
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
        <p className="text-gray-700">
          Pembayaran Anda masih aktif dengan metode: <strong>{payment_type}</strong>
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Silakan selesaikan pembayaran sesuai metode yang Anda pilih.
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              ✅ Pembayaran Aktif
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            )}
          </div>

          <div className="mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <FiClock className="inline mr-2" />
                Anda sudah memilih metode pembayaran. Silakan selesaikan pembayaran dengan detail di bawah ini.
              </p>
            </div>
          </div>

          {renderPaymentDetails()}

          {paymentData.expiry_time && (
            <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <FiClock className="inline mr-2" />
                <strong>Berlaku hingga:</strong>{' '}
                {new Date(paymentData.expiry_time).toLocaleString('id-ID', {
                  dateStyle: 'full',
                  timeStyle: 'short'
                })}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {onClose && (
              <button
                onClick={onClose}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Tutup
              </button>
            )}
            <button
              onClick={() => window.location.href = '/booking-history'}
              className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Lihat Riwayat Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
