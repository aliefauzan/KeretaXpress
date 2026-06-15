'use client';

import { useEffect, useState, useRef } from 'react';
import { FiCheckCircle, FiClock, FiXCircle, FiAlertCircle, FiX, FiRefreshCw } from 'react-icons/fi';
import { useAdminBookingsSSE } from '@/hooks/useAdminBookingsSSE';
import Modal from '@/components/ui/Modal';

interface Booking {
  id: number;
  booking_code: string;
  user_name: string;
  user_email: string;
  train_name: string;
  departure_station_name: string;
  arrival_station_name: string;
  departure_time: string;
  arrival_time: string;
  booking_date: string;
  passenger_count: number;
  total_amount: string;
  status: string;
  payment_status: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [confirmData, setConfirmData] = useState({
    status: 'paid',
    notes: '',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // 🔔 Real-time SSE updates (replaces polling)
  const { shouldRefresh, lastEvent, isConnected } = useAdminBookingsSSE({
    enableSSE: true,
    autoRefresh: true
  });

  const fetchBookings = async (showLoader = true) => {
    try {
      if (showLoader) setIsRefreshing(true);
      const token = localStorage.getItem('adminToken');
      const validPage = !isNaN(currentPage) && currentPage > 0 ? currentPage : 1;
      let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/bookings?page=${validPage}&limit=10`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setTotalPages(data.pagination?.pages || 1);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage, shouldRefresh]); // 🔔 Refresh when SSE triggers update

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/payments/${selectedBooking.booking_code}/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(confirmData),
        }
      );

      if (response.ok) {
        setModalMessage('Payment confirmed successfully!');
        setShowSuccessModal(true);
        setShowConfirmModal(false);
        setSelectedBooking(null);
        setConfirmData({ status: 'paid', notes: '' });
        fetchBookings();
      } else {
        const error = await response.json();
        setModalMessage(error.message || 'Failed to confirm payment');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      setModalMessage('Failed to confirm payment');
      setShowErrorModal(true);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    setIsCancelling(true);
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bookings/${selectedBooking.booking_code}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: cancelReason }),
        }
      );

      if (response.ok) {
        setModalMessage('Booking berhasil dibatalkan');
        setShowSuccessModal(true);
        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancelReason('');
        fetchBookings();
      } else {
        const error = await response.json();
        setModalMessage(error.message || 'Gagal membatalkan booking');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setModalMessage('Gagal membatalkan booking');
      setShowErrorModal(true);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
          <FiCheckCircle size={14} /> <span>Paid</span>
        </span>
      );
    } else if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
          <FiXCircle size={14} /> <span>Cancelled</span>
        </span>
      );
    } else if (status === 'expired') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
          <FiAlertCircle size={14} /> <span>Expired</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
          <FiClock size={14} /> <span>Pending</span>
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-900 font-medium">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-blue-100 mt-1">Manage customer bookings and payments</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm bg-blue-500/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-blue-400/30">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-white">
                {isConnected ? 'Live' : 'Offline'} • {lastUpdate.toLocaleTimeString('id-ID')}
              </span>
            </div>
            <button
              onClick={() => fetchBookings()}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-all disabled:opacity-50 text-white"
            >
              <FiRefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm text-gray-500 mb-1">Total Bookings</div>
          <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
        </div>
        <div className="bg-white border border-yellow-100 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => b.payment_status === 'pending').length}
          </div>
        </div>
        <div className="bg-white border border-green-100 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm text-gray-500 mb-1">Paid</div>
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.payment_status === 'paid').length}
          </div>
        </div>
        <div className="bg-white border border-red-100 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm text-gray-500 mb-1">Cancelled</div>
          <div className="text-2xl font-bold text-red-600">
            {bookings.filter(b => b.status === 'cancelled').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-lg">
        <div className="flex items-center space-x-4">
          <label className="font-medium text-sm text-gray-700">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-blue-100 rounded-lg overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Train</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider">Passengers</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{booking.booking_code}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.user_name}</div>
                    <div className="text-xs text-gray-500">{booking.user_email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{booking.train_name}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{booking.departure_station_name}</div>
                    <div className="text-xs text-gray-500">→ {booking.arrival_station_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(booking.booking_date).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-gray-500">{booking.departure_time}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 font-medium">{booking.passenger_count}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    Rp {parseInt(booking.total_amount).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(booking.status, booking.payment_status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {booking.payment_status === 'pending' && booking.status !== 'expired' && booking.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowConfirmModal(true);
                            }}
                            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancelModal(true);
                            }}
                            className="px-4 py-2 text-sm font-medium border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {bookings.length === 0 && (
            <div className="text-center py-12">
              <FiAlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No bookings found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-blue-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="text-sm text-blue-900 font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl border border-blue-100">
            <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-red-600 to-red-700 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Batalkan Booking</h2>
              <button 
                onClick={() => { setShowCancelModal(false); setSelectedBooking(null); setCancelReason(''); }}
                className="text-white hover:text-red-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Booking Details */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 font-medium">Booking Code:</span>
                  <span className="font-mono font-semibold text-blue-900">{selectedBooking.booking_code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 font-medium">Customer:</span>
                  <span className="font-medium text-blue-900">{selectedBooking.user_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 font-medium">Train:</span>
                  <span className="font-medium text-blue-900">{selectedBooking.train_name}</span>
                </div>
              </div>

              <p className="text-gray-700 text-sm">
                Apakah Anda yakin ingin membatalkan booking ini? Tindakan ini tidak dapat dibatalkan.
              </p>

              {/* Cancel Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alasan Pembatalan <span className="text-gray-500 font-normal">(Opsional)</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Masukkan alasan pembatalan..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCancelModal(false); setSelectedBooking(null); setCancelReason(''); }}
                  disabled={isCancelling}
                  className="px-6 py-2 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showConfirmModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl border border-blue-100">
            <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Confirm Payment</h2>
              <button 
                onClick={() => { setShowConfirmModal(false); setSelectedBooking(null); }}
                className="text-white hover:text-blue-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              {/* Booking Details */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 font-medium">Booking Code:</span>
                  <span className="font-mono font-semibold text-blue-900">{selectedBooking.booking_code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 font-medium">Customer:</span>
                  <span className="font-medium text-blue-900">{selectedBooking.user_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 font-medium">Train:</span>
                  <span className="font-medium text-blue-900">{selectedBooking.train_name}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-blue-300 pt-2 mt-2">
                  <span className="text-blue-700 font-bold">Total Amount:</span>
                  <span className="font-bold text-lg text-blue-900">
                    Rp {parseInt(selectedBooking.total_amount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Status</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border-blue-200 hover:border-blue-400">
                    <input
                      type="radio"
                      value="paid"
                      checked={confirmData.status === 'paid'}
                      onChange={(e) => setConfirmData({ ...confirmData, status: e.target.value })}
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    <FiCheckCircle className="text-green-600" size={20} />
                    <span className="font-medium text-gray-900">Paid - Mark as successful</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border-blue-200 hover:border-blue-400">
                    <input
                      type="radio"
                      value="failed"
                      checked={confirmData.status === 'failed'}
                      onChange={(e) => setConfirmData({ ...confirmData, status: e.target.value })}
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    <FiXCircle className="text-red-600" size={20} />
                    <span className="font-medium text-gray-900">Failed - Payment rejected</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border-blue-200 hover:border-blue-400">
                    <input
                      type="radio"
                      value="cancelled"
                      checked={confirmData.status === 'cancelled'}
                      onChange={(e) => setConfirmData({ ...confirmData, status: e.target.value })}
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    <FiAlertCircle className="text-gray-600" size={20} />
                    <span className="font-medium text-gray-900">Cancelled - Cancel booking</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={confirmData.notes}
                  onChange={(e) => setConfirmData({ ...confirmData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  rows={3}
                  placeholder="Add any notes about this confirmation..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowConfirmModal(false); setSelectedBooking(null); }}
                  className="px-6 py-2 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all shadow-md hover:shadow-lg"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Berhasil"
        message={modalMessage}
        type="success"
        confirmText="OK"
      />

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Gagal"
        message={modalMessage}
        type="error"
        confirmText="OK"
      />
    </div>
  );
}
