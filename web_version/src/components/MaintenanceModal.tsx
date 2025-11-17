'use client';

import { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle, FiCalendar } from 'react-icons/fi';

interface Train {
  id: number;
  name: string;
  operator: string;
}

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  train: Train | null;
  onSuccess: () => void;
}

interface ConflictData {
  hasConflicts: boolean;
  conflictCount: number;
  datesWithBookings: string[];
}

export default function MaintenanceModal({ isOpen, onClose, train, onSuccess }: MaintenanceModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflicts, setConflicts] = useState<ConflictData | null>(null);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setReason('');
      setError('');
      setConflicts(null);
    }
  }, [isOpen]);

  // Check for booking conflicts when dates change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!train) return;

      setIsCheckingConflicts(true);
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/maintenance/check-conflicts?trainId=${train.id}&startDate=${startDate}&endDate=${endDate}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          setConflicts(data.data);
        }
      } catch (err) {
        console.error('Error checking conflicts:', err);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    if (train && startDate && endDate && startDate <= endDate) {
      checkConflicts();
    }
  }, [train, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!train) return;

    // Validation
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (startDate > endDate) {
      setError('End date must be after start date');
      return;
    }

    if (conflicts?.hasConflicts) {
      setError(`Cannot schedule maintenance. There are ${conflicts.conflictCount} existing bookings during this period.`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          trainId: train.id,
          startDate,
          endDate,
          reason: reason || 'Scheduled maintenance',
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to schedule maintenance');
      }
    } catch (err) {
      console.error('Error scheduling maintenance:', err);
      setError('An error occurred while scheduling maintenance');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !train) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold">Schedule Maintenance</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Train Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Train</p>
            <p className="font-semibold text-gray-900">{train.name}</p>
            <p className="text-sm text-gray-600">{train.operator}</p>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiCalendar className="inline mr-2" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiCalendar className="inline mr-2" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Engine overhaul, Safety inspection, Routine maintenance"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Conflict Warning */}
          {isCheckingConflicts && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">Checking for booking conflicts...</p>
            </div>
          )}

          {conflicts?.hasConflicts && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-red-800">Booking Conflicts Detected</p>
                  <p className="text-sm text-red-700 mt-1">
                    There are <strong>{conflicts.conflictCount}</strong> existing bookings during this period.
                    Maintenance cannot be scheduled.
                  </p>
                  {conflicts.datesWithBookings.length > 0 && (
                    <p className="text-xs text-red-600 mt-2">
                      Dates with bookings: {conflicts.datesWithBookings.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!conflicts?.hasConflicts && conflicts !== null && !isCheckingConflicts && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">✓ No booking conflicts. Safe to schedule maintenance.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || isCheckingConflicts || conflicts?.hasConflicts}
            >
              {isLoading ? 'Scheduling...' : 'Schedule Maintenance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
