'use client';

import { useState, useEffect, useCallback } from 'react';
import { bookingService } from '@/utils/api';
import BookingHistorySkeleton from '@/components/skeletons/BookingHistorySkeleton';
import BookingHistoryHeader from '@/components/booking/BookingHistoryHeader';
import BookingControls from '@/components/booking/BookingControls';
import ErrorBookingState from '@/components/booking/ErrorBookingState';
import EmptyBookingState from '@/components/booking/EmptyBookingState';
import BookingList from '@/components/booking/BookingList';

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Semua');
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get user data
      const user = localStorage.getItem('user');
      if (!user) {
        setError("Anda harus login untuk melihat riwayat.");
        setIsLoading(false);
        return;
      }
      
      const userData = JSON.parse(user);
      
      // Fetch booking history
      const bookingData = await bookingService.getBookingHistory(userData.uuid || userData.id);
      
      // Log the response to debug
      console.log('Booking history response:', bookingData);
      
      // Ensure data is an array
      if (Array.isArray(bookingData)) {
        setBookings(bookingData);
      } else {
        console.warn('Booking history data is not an array:', bookingData);
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch booking history:', err);
      if (err.response?.status === 401) {
        setError("Sesi Anda telah berakhir atau Anda tidak diautentikasi. Silakan login kembali.");
      } else {
        setError(err.message || 'Gagal memuat riwayat pemesanan.');
      }
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRefresh = () => {
    fetchBookings();
  };

  const handleUpdateStatusFilter = (status: string) => {
    setSelectedStatusFilter(status);
  };

  const filteredBookings = selectedStatusFilter === 'Semua'
    ? bookings
    : bookings.filter(booking => {
        const statusFromServer = booking.status?.toString() || '';
        const displayStatus = statusFromServer === '' ? 'pending' : statusFromServer;
        return displayStatus.toLowerCase() === selectedStatusFilter.toLowerCase();
      });

  if (isLoading) {
    return <BookingHistorySkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BookingHistoryHeader totalBookings={filteredBookings.length} />
      
      <BookingControls
        totalBookings={filteredBookings.length}
        selectedStatusFilter={selectedStatusFilter}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onStatusFilterChange={handleUpdateStatusFilter}
      />
      
      {error && <ErrorBookingState error={error} />}
      
      {!isLoading && !error && filteredBookings.length === 0 && (
        <EmptyBookingState 
          selectedStatusFilter={selectedStatusFilter}
          onShowAllBookings={() => setSelectedStatusFilter('Semua')}
        />
      )}
      
      {!isLoading && !error && filteredBookings.length > 0 && (
        <BookingList 
          bookings={filteredBookings}
          isLoadingAction={isLoadingAction}
          onCancelSuccess={fetchBookings}
        />
      )}
    </div>
  );
}
