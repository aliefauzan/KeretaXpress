'use client';

import { useState, useEffect } from 'react';
import { FiCopy, FiCheck, FiClock, FiSmartphone, FiX } from 'react-icons/fi';

interface QrCodeDisplayProps {
  qrCodeUrl: string;
  deeplink?: string;
  expiryTime: string;
  paymentType: string;
  onClose: () => void;
}

export default function QrCodeDisplay({ 
  qrCodeUrl, 
  deeplink, 
  expiryTime, 
  paymentType,
  onClose 
}: QrCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryTime).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        setIsExpired(true);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  const handleCopyDeeplink = () => {
    if (deeplink) {
      navigator.clipboard.writeText(deeplink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const paymentName = paymentType === 'qris' ? 'QRIS' : 
                     paymentType === 'gopay' ? 'GoPay' : 
                     paymentType === 'shopeepay' ? 'ShopeePay' : paymentType.toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="text-2xl" />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-800 pr-8">
            Bayar dengan {paymentName}
          </h2>
          
          <div className={`flex items-center gap-2 mt-2 ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
            <FiClock className="text-lg" />
            <span className="font-medium">
              {isExpired ? 'QR Code Kadaluarsa' : `Waktu tersisa: ${timeRemaining}`}
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div className="p-6 flex flex-col items-center">
          {isExpired ? (
            <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center p-4">
                <FiClock className="text-6xl text-red-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-800">QR Code Kadaluarsa</p>
                <p className="text-sm text-gray-600 mt-2">Silakan tutup dan buat pembayaran baru</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
                <img 
                  src={qrCodeUrl} 
                  alt={`${paymentName} QR Code`}
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    console.error('QR Code failed to load');
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect width="256" height="256" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%236b7280"%3EQR Code Error%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              
              <p className="text-sm text-gray-600 text-center mt-4 max-w-sm">
                Scan QR code di atas menggunakan aplikasi {paymentName} Anda
              </p>
            </>
          )}
        </div>

        {/* Deeplink Button (for mobile) */}
        {!isExpired && deeplink && (
          <div className="px-6 pb-4">
            <a
              href={deeplink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <FiSmartphone className="text-lg" />
              Buka di Aplikasi {paymentName}
            </a>
            
            <button
              onClick={handleCopyDeeplink}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {copied ? <FiCheck className="text-green-600" /> : <FiCopy />}
              {copied ? 'Link Tersalin!' : 'Salin Link Pembayaran'}
            </button>
          </div>
        )}

        {/* Instructions */}
        {!isExpired && (
          <div className="px-6 pb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Cara Pembayaran:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Buka aplikasi {paymentName} di HP Anda</li>
                <li>Pilih menu Scan QR atau Bayar</li>
                <li>Scan QR code di atas</li>
                <li>Konfirmasi pembayaran</li>
                <li>Pembayaran otomatis terverifikasi</li>
              </ol>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="px-6 pb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <span className="font-semibold">Catatan:</span> Jangan bagikan QR code ini kepada siapa pun. 
              {!isExpired && ' QR code akan kadaluarsa setelah 15 menit.'}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isExpired ? 'Tutup dan Buat Pembayaran Baru' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
}
