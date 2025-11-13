'use client';

import { useEffect, useState, useCallback } from 'react';
import { FiDollarSign, FiPackage, FiCheckCircle, FiClock, FiTrendingUp, FiCalendar } from 'react-icons/fi';

interface Statistics {
  pending_bookings: number;
  paid_bookings: number;
  cancelled_bookings: number;
  expired_bookings: number;
  total_bookings: number;
  total_revenue: number;
  bookings_last_7_days: number;
  bookings_last_30_days: number;
}

type DateFilter = '1d' | '7d' | '30d' | 'custom' | 'all';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const fetchStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      
      let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/bookings/statistics`;
      const params = new URLSearchParams();
      
      if (dateFilter !== 'all') {
        params.append('period', dateFilter);
        
        if (dateFilter === 'custom' && customDateFrom && customDateTo) {
          params.append('date_from', customDateFrom);
          params.append('date_to', customDateTo);
        }
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, customDateFrom, customDateTo]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
    if (filter === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      setCustomDateFrom('');
      setCustomDateTo('');
    }
  };

  const handleApplyCustomDate = () => {
    if (customDateFrom && customDateTo) {
      fetchStatistics();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.total_revenue || 0),
      icon: FiDollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Bookings',
      value: stats?.total_bookings || 0,
      icon: FiPackage,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Paid Bookings',
      value: stats?.paid_bookings || 0,
      icon: FiCheckCircle,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Pending Bookings',
      value: stats?.pending_bookings || 0,
      icon: FiClock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-blue-100 mt-1">Overview of your train booking system</p>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center gap-2 mb-4">
          <FiCalendar className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Filter Periode</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDateFilterChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              dateFilter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => handleDateFilterChange('1d')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              dateFilter === '1d'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            1 Hari
          </button>
          <button
            onClick={() => handleDateFilterChange('7d')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              dateFilter === '7d'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => handleDateFilterChange('30d')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              dateFilter === '30d'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            30 Hari
          </button>
          <button
            onClick={() => handleDateFilterChange('custom')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              dateFilter === 'custom'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom Date Range Picker */}
        {showCustomDatePicker && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleApplyCustomDate}
                disabled={!customDateFrom || !customDateTo}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all"
              >
                Terapkan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.bgColor} ${card.textColor} p-3 rounded-lg shadow-sm`}>
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-blue-600" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Bookings (Last 7 days)</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats?.bookings_last_7_days || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Bookings (Last 30 days)</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats?.bookings_last_30_days || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Booking Status Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 transition-colors">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3 shadow-sm"></div>
                <span className="text-gray-700 font-medium">Pending</span>
              </div>
              <span className="font-bold text-lg">{stats?.pending_bookings || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 shadow-sm"></div>
                <span className="text-gray-700 font-medium">Paid</span>
              </div>
              <span className="font-bold text-lg">{stats?.paid_bookings || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3 shadow-sm"></div>
                <span className="text-gray-700 font-medium">Cancelled</span>
              </div>
              <span className="font-bold text-lg">{stats?.cancelled_bookings || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-3 shadow-sm"></div>
                <span className="text-gray-700 font-medium">Expired</span>
              </div>
              <span className="font-bold text-lg">{stats?.expired_bookings || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/trains"
            className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all text-center group shadow-sm hover:shadow-md"
          >
            <p className="font-semibold text-gray-900 group-hover:text-blue-700">Manage Trains</p>
            <p className="text-sm text-gray-600 mt-1">Add or edit train schedules</p>
          </a>
          <a
            href="/admin/bookings"
            className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all text-center group shadow-sm hover:shadow-md"
          >
            <p className="font-semibold text-gray-900 group-hover:text-blue-700">View Bookings</p>
            <p className="text-sm text-gray-600 mt-1">Manage customer bookings</p>
          </a>
          <a
            href="/admin/bookings?status=pending"
            className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all text-center group shadow-sm hover:shadow-md"
          >
            <p className="font-semibold text-gray-900 group-hover:text-blue-700">Pending Payments</p>
            <p className="text-sm text-gray-600 mt-1">Confirm manual payments</p>
          </a>
        </div>
      </div>
    </div>
  );
}
