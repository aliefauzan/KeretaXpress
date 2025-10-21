'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiX } from 'react-icons/fi';

interface Train {
  id: number;
  name: string;
  operator: string;
  class_type: string;
  available_seats: number;
  departure_station_id: number;
  arrival_station_id: number;
  departure_station_name?: string;
  arrival_station_name?: string;
  departure_time: string;
  arrival_time: string;
  price: string;
  total_bookings?: number;
}

interface Station {
  id: number;
  name: string;
  city: string;
}

export default function TrainsPage() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrain, setEditingTrain] = useState<Train | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    name: '',
    operator: 'PT. KAI',
    class_type: 'economy',
    available_seats: 50,
    departure_station_id: '',
    arrival_station_id: '',
    departure_time: '',
    arrival_time: '',
    price: '',
  });

  useEffect(() => {
    fetchTrains();
    fetchStations();
  }, []);

  const fetchTrains = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/trains`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTrains(data.trains);
      }
    } catch (error) {
      console.error('Error fetching trains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stations`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStations(data);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});
    
    const token = localStorage.getItem('adminToken');

    try {
      const url = editingTrain
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/trains/${editingTrain.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/trains`;

      const response = await fetch(url, {
        method: editingTrain ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          departure_station_id: parseInt(formData.departure_station_id),
          arrival_station_id: parseInt(formData.arrival_station_id),
          price: parseFloat(formData.price),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(editingTrain ? 'Train updated successfully!' : 'Train created successfully!');
        setShowModal(false);
        resetForm();
        fetchTrains();
      } else {
        // Handle validation errors
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        setErrorMessage(data.message || 'Failed to save train');
      }
    } catch (error) {
      console.error('Error saving train:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  const handleEdit = (train: Train) => {
    setEditingTrain(train);
    setFormData({
      name: train.name,
      operator: train.operator,
      class_type: train.class_type,
      available_seats: train.available_seats,
      departure_station_id: train.departure_station_id.toString(),
      arrival_station_id: train.arrival_station_id.toString(),
      departure_time: train.departure_time,
      arrival_time: train.arrival_time,
      price: train.price,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this train?')) return;

    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/trains/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Train deleted successfully!');
        fetchTrains();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete train');
      }
    } catch (error) {
      console.error('Error deleting train:', error);
      alert('Failed to delete train');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      operator: 'PT. KAI',
      class_type: 'economy',
      available_seats: 50,
      departure_station_id: '',
      arrival_station_id: '',
      departure_time: '',
      arrival_time: '',
      price: '',
    });
    setEditingTrain(null);
    setErrorMessage('');
    setFieldErrors({});
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Train Management</h1>
          <p className="text-gray-600 mt-1">Manage train schedules and availability</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiPlus /> <span>Add Train</span>
        </button>
      </div>

      {/* Trains Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Train Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trains.map((train) => (
                <tr key={train.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{train.name}</div>
                    <div className="text-sm text-gray-500">{train.operator}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">
                      {train.class_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>{train.departure_station_name}</div>
                      <div className="text-gray-500">→ {train.arrival_station_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{train.departure_time}</div>
                    <div className="text-gray-500">→ {train.arrival_time}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{train.available_seats}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    Rp {parseInt(train.price).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">{train.total_bookings || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(train)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(train.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingTrain ? 'Edit Train' : 'Add New Train'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Error Message Display */}
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{errorMessage}</h3>
                      {Object.keys(fieldErrors).length > 0 && (
                        <div className="mt-2 text-sm text-red-700">
                          <ul className="list-disc list-inside space-y-1">
                            {Object.entries(fieldErrors).map(([field, errors]) => (
                              <li key={field}>
                                <strong className="capitalize">{field}:</strong> {errors.join(', ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Train Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Operator</label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Class Type</label>
                  <select
                    value={formData.class_type}
                    onChange={(e) => setFormData({ ...formData, class_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="economy">Economy</option>
                    <option value="business">Business</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Available Seats</label>
                  <input
                    type="number"
                    value={formData.available_seats}
                    onChange={(e) => setFormData({ ...formData, available_seats: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Departure Station</label>
                  <select
                    value={formData.departure_station_id}
                    onChange={(e) => setFormData({ ...formData, departure_station_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Station</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Arrival Station</label>
                  <select
                    value={formData.arrival_station_id}
                    onChange={(e) => setFormData({ ...formData, arrival_station_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Station</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Departure Time (HH:MM:SS)</label>
                  <div className="relative">
                    <input
                      type="time"
                      step="1"
                      value={formData.departure_time.substring(0, 8)}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        // Ensure HH:MM:SS format
                        const formattedTime = timeValue.length === 8 ? timeValue : `${timeValue}:00`;
                        setFormData({ ...formData, departure_time: formattedTime });
                      }}
                      className="w-full px-3 py-2 border rounded-lg pr-12"
                      required
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                      ✓ OK
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Arrival Time (HH:MM:SS)</label>
                  <div className="relative">
                    <input
                      type="time"
                      step="1"
                      value={formData.arrival_time.substring(0, 8)}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        // Ensure HH:MM:SS format
                        const formattedTime = timeValue.length === 8 ? timeValue : `${timeValue}:00`;
                        setFormData({ ...formData, arrival_time: formattedTime });
                      }}
                      className="w-full px-3 py-2 border rounded-lg pr-12"
                      required
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                      ✓ OK
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Price (IDR)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      fieldErrors.price ? 'border-red-500' : ''
                    }`}
                    min="0"
                    max="9999999999.99"
                    step="0.01"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum: Rp 9,999,999,999.99
                  </p>
                  {fieldErrors.price && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.price.join(', ')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTrain ? 'Update Train' : 'Create Train'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
