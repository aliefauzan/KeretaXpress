'use client';

import { useEffect, useState } from 'react';
import { FiDollarSign, FiPackage, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi';

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/bookings/statistics`, {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your train booking system</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.bgColor} ${card.textColor} p-3 rounded-lg`}>
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-blue-600" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bookings (Last 7 days)</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats?.bookings_last_7_days || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bookings (Last 30 days)</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats?.bookings_last_30_days || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Booking Status Breakdown */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Pending</span>
              </div>
              <span className="font-semibold">{stats?.pending_bookings || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Paid</span>
              </div>
              <span className="font-semibold">{stats?.paid_bookings || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Cancelled</span>
              </div>
              <span className="font-semibold">{stats?.cancelled_bookings || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Expired</span>
              </div>
              <span className="font-semibold">{stats?.expired_bookings || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/trains"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <p className="font-semibold text-gray-900">Manage Trains</p>
            <p className="text-sm text-gray-600 mt-1">Add or edit train schedules</p>
          </a>
          <a
            href="/admin/bookings"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <p className="font-semibold text-gray-900">View Bookings</p>
            <p className="text-sm text-gray-600 mt-1">Manage customer bookings</p>
          </a>
          <a
            href="/admin/bookings?status=pending"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <p className="font-semibold text-gray-900">Pending Payments</p>
            <p className="text-sm text-gray-600 mt-1">Confirm manual payments</p>
          </a>
        </div>
      </div>
    </div>
  );
}
