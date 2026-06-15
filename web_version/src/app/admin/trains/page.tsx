'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiX, FiRefreshCw, FiTool } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import MaintenanceModal from '@/components/MaintenanceModal';

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
  status?: string;
  current_maintenance?: {
    id: number;
    start_date: string;
    end_date: string;
    reason: string;
  };
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  // Maintenance modal state
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedTrainForMaintenance, setSelectedTrainForMaintenance] = useState<Train | null>(null);
  const [showEndMaintenanceConfirm, setShowEndMaintenanceConfirm] = useState(false);
  const [maintenanceToEnd, setMaintenanceToEnd] = useState<number | null>(null);
  
  // Filter states
  const [classFilter, setClassFilter] = useState<string>('all');
  const [departureStationFilter, setDepartureStationFilter] = useState<string>('all');
  const [arrivalStationFilter, setArrivalStationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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
        console.log('Fetched trains:', data.trains);
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
        setModalMessage(editingTrain ? 'Train updated successfully!' : 'Train created successfully!');
        setShowSuccessModal(true);
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
        setModalMessage('Train deleted successfully!');
        setShowSuccessModal(true);
        fetchTrains();
      } else {
        const error = await response.json();
        setModalMessage(error.message || 'Failed to delete train');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error deleting train:', error);
      setModalMessage('Failed to delete train');
      setShowErrorModal(true);
    }
  };

  const handleEndMaintenance = (maintenanceId: number) => {
    setMaintenanceToEnd(maintenanceId);
    setShowEndMaintenanceConfirm(true);
  };

  const confirmEndMaintenance = async () => {
    if (!maintenanceToEnd) return;

    setShowEndMaintenanceConfirm(false);
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/maintenance/${maintenanceToEnd}/end`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();

      if (data.success) {
        // Force refresh by clearing and re-fetching
        setTrains([]);
        await fetchTrains();
        setModalMessage('Maintenance ended successfully! Train is now active.');
        setShowSuccessModal(true);
      } else {
        setModalMessage(data.message || 'Failed to end maintenance');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error ending maintenance:', error);
      setModalMessage('Failed to end maintenance');
      setShowErrorModal(true);
    } finally {
      setMaintenanceToEnd(null);
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

  // Filter trains based on selected filters
  const filteredTrains = trains.filter(train => {
    // Class filter
    if (classFilter !== 'all' && train.class_type !== classFilter) return false;
    
    // Departure station filter - ensure both sides are numbers for comparison
    if (departureStationFilter !== 'all') {
      const filterStationId = parseInt(departureStationFilter);
      const trainDepartureId = typeof train.departure_station_id === 'string' 
        ? parseInt(train.departure_station_id) 
        : train.departure_station_id;
      if (trainDepartureId !== filterStationId) return false;
    }
    
    // Arrival station filter - ensure both sides are numbers for comparison
    if (arrivalStationFilter !== 'all') {
      const filterStationId = parseInt(arrivalStationFilter);
      const trainArrivalId = typeof train.arrival_station_id === 'string' 
        ? parseInt(train.arrival_station_id) 
        : train.arrival_station_id;
      if (trainArrivalId !== filterStationId) return false;
    }
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = train.name?.toLowerCase().includes(query) || false;
      const matchesOperator = train.operator?.toLowerCase().includes(query) || false;
      const matchesDeparture = train.departure_station_name?.toLowerCase().includes(query) || false;
      const matchesArrival = train.arrival_station_name?.toLowerCase().includes(query) || false;
      if (!matchesName && !matchesOperator && !matchesDeparture && !matchesArrival) return false;
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-900 font-medium">Loading trains...</p>
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
            <h1 className="text-3xl font-bold">Train Management</h1>
            <p className="text-blue-100 mt-1">Manage train schedules and availability</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-all shadow-md hover:shadow-lg"
          >
            <FiPlus /> <span>Add Train</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm text-gray-500 mb-1">Total Trains</div>
          <div className="text-2xl font-bold text-blue-600">{trains.length}</div>
        </div>
        <div className="bg-white border border-green-100 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm text-gray-500 mb-1">Economy Class</div>
          <div className="text-2xl font-bold text-green-600">
            {trains.filter(t => t.class_type === 'economy').length}
          </div>
        </div>
        <div className="bg-white border border-purple-100 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm text-gray-500 mb-1">Bisnis Class</div>
          <div className="text-2xl font-bold text-purple-600">
            {trains.filter(t => t.class_type === 'Bisnis').length}
          </div>
        </div>
        <div className="bg-white border border-orange-100 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm text-gray-500 mb-1">Eksekutif Class</div>
          <div className="text-2xl font-bold text-orange-600">
            {trains.filter(t => t.class_type === 'Eksekutif').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-blue-100 rounded-lg p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Departure Station */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stasiun Keberangkatan</label>
            <select
              value={departureStationFilter}
              onChange={(e) => setDepartureStationFilter(e.target.value)}
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Stasiun</option>
              {stations.map(station => (
                <option key={station.id} value={station.id.toString()}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          {/* Arrival Station */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stasiun Tujuan</label>
            <select
              value={arrivalStationFilter}
              onChange={(e) => setArrivalStationFilter(e.target.value)}
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Stasiun</option>
              {stations.map(station => (
                <option key={station.id} value={station.id.toString()}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Kelas</option>
              <option value="economy">Economy</option>
              <option value="Bisnis">Bisnis</option>
              <option value="Eksekutif">Eksekutif</option>
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cari Kereta</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama kereta, operator, atau stasiun..."
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Menampilkan <span className="font-semibold text-blue-600">{filteredTrains.length}</span> dari <span className="font-semibold">{trains.length}</span> kereta
          </div>
          {(classFilter !== 'all' || departureStationFilter !== 'all' || arrivalStationFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setClassFilter('all');
                setDepartureStationFilter('all');
                setArrivalStationFilter('all');
                setSearchQuery('');
              }}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-700 hover:text-blue-900 font-medium border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <FiRefreshCw size={16} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Trains Table */}
      <div className="bg-white border border-blue-100 rounded-lg overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Train Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Seats</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {filteredTrains.map((train) => (
                <tr key={train.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-gray-900">{train.name}</div>
                          <div className="text-sm text-gray-500">{train.operator}</div>
                        </div>
                      </div>
                      {train.status === 'maintenance' && train.current_maintenance && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full flex items-center gap-1">
                          🔧 Maintenance
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(train.current_maintenance.start_date).toLocaleDateString('id-ID')} - {new Date(train.current_maintenance.end_date).toLocaleDateString('id-ID')}
                        </span>
                        <button
                          onClick={() => train.current_maintenance?.id && handleEndMaintenance(train.current_maintenance.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                          title="End maintenance now"
                        >
                          Cancel
                        </button>
                      </div>
                      )}
                    </div>
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
                        onClick={() => {
                          setSelectedTrainForMaintenance(train);
                          setShowMaintenanceModal(true);
                        }}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Schedule Maintenance"
                      >
                        <FiTool size={18} />
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-100 shadow-2xl">
            <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingTrain ? 'Edit Train' : 'Add New Train'}
              </h2>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-white hover:text-blue-100"
              >
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
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Operator</label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Class Type</label>
                  <select
                    value={formData.class_type}
                    onChange={(e) => setFormData({ ...formData, class_type: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="economy">Economy</option>
                    <option value="Bisnis">Bisnis</option>
                    <option value="Eksekutif">Eksekutif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Available Seats</label>
                  <input
                    type="number"
                    value={formData.available_seats}
                    onChange={(e) => setFormData({ ...formData, available_seats: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Departure Station</label>
                  <select
                    value={formData.departure_station_id}
                    onChange={(e) => setFormData({ ...formData, departure_station_id: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
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
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-blue-300 focus:border-blue-500'
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
                  className="px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all shadow-md hover:shadow-lg"
                >
                  {editingTrain ? 'Update Train' : 'Create Train'}
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

      {/* Maintenance Modal */}
      <MaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => {
          setShowMaintenanceModal(false);
          setSelectedTrainForMaintenance(null);
        }}
        train={selectedTrainForMaintenance}
        onSuccess={() => {
          fetchTrains();
          setModalMessage('Maintenance scheduled successfully');
          setShowSuccessModal(true);
        }}
      />

      {/* End Maintenance Confirmation Modal */}
      <Modal
        isOpen={showEndMaintenanceConfirm}
        onClose={() => {
          setShowEndMaintenanceConfirm(false);
          setMaintenanceToEnd(null);
        }}
        title="End Maintenance"
        message="Are you sure you want to end this maintenance now? The train will become available immediately."
        type="confirm"
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={confirmEndMaintenance}
      />
    </div>
  );
}
