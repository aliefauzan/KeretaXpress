import apiClient from '@/utils/apiClient';
import axios from 'axios';
import { Train, BookingDisplay } from '@/types';
import { formatCurrency } from '@/utils/format';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper functions to transform data between backend and frontend formats
const transformTrainData = (train: any): Train => {
  if (!train) return {} as Train;
  
  // Format date and time from departure_time if available
  let date = '';
  let time = '';
  let arrivalTime = '';
  
  if (train.departure_time) {
    const departureDateTime = new Date(train.departure_time);
    date = departureDateTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    time = departureDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  if (train.arrival_time) {
    const arrivalDateTime = new Date(train.arrival_time);
    arrivalTime = arrivalDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  // Calculate duration from departure and arrival times or use travel_time if available
  let duration = train.travel_time || '';
  if (!duration && train.departure_time && train.arrival_time) {
    const departureTime = new Date(train.departure_time).getTime();
    const arrivalTime = new Date(train.arrival_time).getTime();
    const durationMinutes = Math.floor((arrivalTime - departureTime) / 60000);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0) {
      duration = `${hours}h ${minutes}m`;
    } else {
      duration = `${minutes}m`;
    }
  }
  
  // Get station names
  let departureStationName = '';
  let arrivalStationName = '';
  
  if (train.departure_station) {
    departureStationName = train.departure_station.name;
  }
  
  if (train.arrival_station) {
    arrivalStationName = train.arrival_station.name;
  }
  
  // Format price using standardized formatCurrency function
  const priceStr = train.price ? formatCurrency(Number(train.price)) : '';
  
  return {
    id: train.id ? train.id.toString() : '',
    name: train.name || '',
    operator: train.operator || 'PT. KAI',
    date,
    time,
    departure: train.departure_station_id?.toString() || '',
    arrival: train.arrival_station_id?.toString() || '',
    arrivalTime,
    duration,
    classType: train.class_type || 'Ekonomi',
    price: priceStr,
    seatsLeft: train.available_seats || 0,
    departureStationName,
    arrivalStationName
  };
};

const transformBookingData = (booking: any): BookingDisplay => {
  if (!booking) return {} as BookingDisplay;
  
  const train = booking.train || {};
  const departureStation = train.departure_station || {};
  const arrivalStation = train.arrival_station || {};
  
  // Format date from travel_date if available
  let date = '';
  if (booking.travel_date) {
    const travelDate = new Date(booking.travel_date);
    date = travelDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  
  // Format time from train's departure_time if available
  let time = '';
  let arrivalTime = '';
  
  if (train.departure_time) {
    const departureDateTime = new Date(train.departure_time);
    time = departureDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  if (train.arrival_time) {
    const arrivalDateTime = new Date(train.arrival_time);
    arrivalTime = arrivalDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  const statusMap: { [key: string]: string } = {
    'pending': 'Menunggu Pembayaran',
    'paid': 'Sudah Dibayar',
    'confirmed': 'Dikonfirmasi',
    'cancelled': 'Dibatalkan'
  };
  
  const displayStatus = statusMap[booking.status] || booking.status || 'Menunggu Pembayaran';
  
  // Format price using standardized formatCurrency function
  const priceStr = booking.total_price ? formatCurrency(Number(booking.total_price)) : '';
  
  return {
    transactionId: booking.transaction_id || '',
    trainName: train.name || '',
    operator: train.operator || 'PT. KAI',
    date,
    time,
    departure: departureStation.name || '',
    arrival: arrivalStation.name || '',
    arrivalTime,
    status: displayStatus,
    price: priceStr,
    passengerName: booking.passenger_name || '',
    passengerId: booking.passenger_id_card || '',
    passengerDob: booking.passenger_dob || '',
    passengerGender: booking.passenger_gender || '',
    seatClass: train.class_type || 'Ekonomi',
    seatNumber: booking.seat_number || ''
  };
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        statusCode: 0
      });
    }
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject({
        message: error.response.data.message || 'Sesi Anda telah berakhir. Silakan login kembali.',
        statusCode: 401
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/login', { email, password });
      if (response.data.token && typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Set cookie for middleware
        document.cookie = `token=${response.data.token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (name: string, email: string, password: string, password_confirmation: string) => {
    try {
      const response = await api.post('/register', { 
        name, 
        email, 
        password, 
        password_confirmation 
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always remove token and user data even if API call fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Remove cookie
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
  },
  
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          console.error('Error parsing user data:', e);
          return null;
        }
      }
    }
    return null;
  },
  
  isLoggedIn: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  }
};

// Station services
export const stationService = {
  getAllStations: async () => {
    try {
      const response = await api.get('/stations');
      return response.data;
    } catch (error) {
      console.error('Network or API error when fetching stations:', error);
      throw error;
    }
  }
};

// Train services
export const trainService = {
  searchTrains: async (params: any) => {
    try {
      const response = await api.get('/trains/search', { params });
      if (Array.isArray(response.data)) {
        return response.data.map(train => transformTrainData(train));
      }
      return response.data;
    } catch (error) {
      console.error('Error searching trains:', error);
      throw error;
    }
  },

  getAllTrains: async () => {
    try {
      const response = await api.get('/trains/all');
      // Return raw data for manual processing
      return response.data;
    } catch (error) {
      console.error('Error fetching all trains:', error);
      throw error;
    }
  },
  
  getPromoTrains: async () => {
    try {
      const response = await api.get('/trains/promo');
      if (Array.isArray(response.data)) {
        return response.data.map(train => transformTrainData(train));
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching promo trains:', error);
      throw error;
    }
  },
  
  getAvailableSeats: async (trainId: number, date?: string) => {
    try {
      const params = date ? { date } : {};
      const response = await api.get(`/trains/${trainId}/available-seats`, { params });
      return response.data.available_seats || [];
    } catch (error) {
      console.error('Error fetching available seats:', error);
      throw error;
    }
  }
};

// Booking services
export const bookingService = {
  createBooking: async (bookingData: any) => {
    try {
      const response = await api.post('/bookings', bookingData);
      // Return raw booking data, not transformed
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },
  
  getBookingHistory: async (userUuid: string) => {
    try {
      const response = await api.get(`/bookings/history?user_uuid=${userUuid}`);
      // Return raw data for manual processing on frontend
      return response.data;
    } catch (error) {
      console.error('Error fetching booking history:', error);
      throw error;
    }
  },
  
  updateBookingStatus: async (transactionId: string, status: string) => {
    try {
      const response = await api.put(`/bookings/${transactionId}/status`, { status });
      return transformBookingData(response.data);
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  uploadPaymentProof: async (bookingId: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('proof', file);
      
      const response = await api.post(`/payments/${bookingId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
    }
  }
};

// Payment services
export const paymentService = {
  uploadPaymentProof: async (bookingId: number, formData: FormData) => {
    try {
      const response = await api.post(`/payments/${bookingId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
    }
  }
};

export default api;