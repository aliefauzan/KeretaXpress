'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';
import { FiCheckCircle, FiClock, FiAlertCircle, FiInfo, FiX, FiDownload } from 'react-icons/fi';
import { Train } from '@/types';
import { bookingService } from '@/utils/api';
import { openTicketInNewTab, downloadTicket } from '@/utils/ticketGenerator';

interface BookingCardProps {
  booking: any;
  train: Train;
  displayStatus: string;
  isLoadingAction: boolean;
  onCancelSuccess?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ 
  booking, 
  train, 
  displayStatus, 
  isLoadingAction,
  onCancelSuccess 
}) => {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancelBooking = async () => {
    if (!booking.transaction_id) return;
    
    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(booking.transaction_id);
      setShowCancelConfirm(false);
      if (onCancelSuccess) {
        onCancelSuccess();
      }
      // Optionally show success message
      alert('Booking berhasil dibatalkan');
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Gagal membatalkan booking';
      alert(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadTicket = () => {
    const ticketData = {
      booking: booking,
      train: {
        name: booking.train_name || train.name,
        class_type: booking.class_type || train.classType,
        departure_time: booking.departure_time || train.time,
        arrival_time: booking.arrival_time || train.arrivalTime,
        departure_station: booking.departure_station,
        arrival_station: booking.arrival_station
      },
      passenger: {
        name: booking.passenger_name || 'N/A',
        idNumber: booking.passenger_id_number || 'N/A',
        seatNumber: booking.seat_number || 'N/A'
      }
    };
    
    // Open ticket in new tab for viewing/printing
    openTicketInNewTab(ticketData);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <FiClock className="mr-2" />;
      case 'confirmed':
      case 'paid':
        return <FiCheckCircle className="mr-2" />;
      case 'cancelled':
      case 'failed':
      case 'expired':
        return <FiAlertCircle className="mr-2" />;
      default:
        return <FiInfo className="mr-2" />;
    }
  };

  const getBorderColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'border-yellow-500';
      case 'confirmed':
      case 'paid':
        return 'border-green-500';
      default:
        return 'border-red-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden transition-all hover:shadow-card-hover">
      <div className={`p-5 border-l-4 ${getBorderColor(displayStatus)}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
          <div>
            <h2 className="text-xl font-semibold text-primary">{train.name || 'Train Name N/A'}</h2>
            <p className="text-sm text-gray-500">Operator: {train.operator || 'Operator N/A'}</p>
          </div>
          <div className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(displayStatus)}`}>
            {getStatusIcon(displayStatus)}
            {displayStatus ? displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1) : 'Tidak Diketahui'}
          </div>
        </div>

        {/* Booking Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-500">ID Transaksi:</p>
            <p className="font-medium text-gray-700">{booking.transaction_id}</p>
          </div>
          <div>
            <p className="text-gray-500">Tanggal:</p>
            <p className="font-medium text-gray-700">{train.date ? formatDate(train.date) : 'Tanggal tidak tersedia'}</p>
          </div>
          <div>
            <p className="text-gray-500">Waktu:</p>
            <p className="font-medium text-gray-700">
              {train.time && formatTime(train.time) !== 'Invalid Date' ? formatTime(train.time) : 'Waktu tidak tersedia'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Rute:</p>
            <p className="font-medium text-gray-700">{train.departure || 'N/A'} → {train.arrival || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Kelas:</p>
            <p className="font-medium text-gray-700">{train.classType || 'Kelas tidak tersedia'}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Harga:</p>
            <p className="font-bold text-lg text-green-600">{formatCurrency(Number(booking.total_price) || 0)}</p>
          </div>
        </div>
        
        {/* Booking Date */}
        <div className="text-xs text-gray-400 mb-3">
          Dipesan pada: {booking.created_at && !isNaN(new Date(booking.created_at).getTime()) 
            ? `${formatDate(booking.created_at)} ${formatTime(booking.created_at)}` 
            : 'Tanggal tidak tersedia'}
        </div>

        {/* Passenger Info */}
        {booking.passenger_name && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Penumpang:</p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              <li>{booking.passenger_name} (ID: {booking.passenger_id_number || 'N/A'}, Kursi: {booking.seat_number || 'N/A'})</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 border-t border-gray-200">
          {displayStatus.toLowerCase() === 'pending' && (
            <>
              <Button 
                onClick={() => setShowCancelConfirm(true)} 
                variant="outline"
                size="sm"
                disabled={isLoadingAction || isCancelling}
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <FiX className="mr-1" /> Batalkan
              </Button>
              <Button 
                onClick={() => router.push(`/payment?bookingId=${booking.transaction_id}`)} 
                variant="primary"
                size="sm"
                disabled={isLoadingAction}
              >
                Lanjutkan Pembayaran
              </Button>
            </>
          )}
          {(displayStatus.toLowerCase() === 'confirmed' || displayStatus.toLowerCase() === 'paid') && (
            <Button 
              onClick={handleDownloadTicket} 
              variant="outline"
              size="sm"
            >
              <FiDownload className="mr-1" /> Download Tiket
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Konfirmasi Pembatalan</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin membatalkan booking ini?
              <br />
              <span className="font-medium text-gray-900">ID: {booking.transaction_id}</span>
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowCancelConfirm(false)}
                variant="outline"
                size="md"
                disabled={isCancelling}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleCancelBooking}
                variant="primary"
                size="md"
                disabled={isCancelling}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCard;
