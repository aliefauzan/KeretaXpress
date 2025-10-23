import apiClient from '@/utils/apiClient';
import { Train, BookingDisplay } from '@/types';
import { formatCurrency } from '@/utils/format';

// Helper functions to transform data between backend and frontend formats
const transformTrainData = (train: any): Train => {
  if (!train) return {} as Train;
  
  // Format date and time - departure_time and arrival_time are now TIME type (HH:MM:SS)
  let date = '';
  let time = '';
  let arrivalTime = '';
  
  if (train.departure_time) {
    // departure_time is now TIME (HH:MM:SS), just format it
    time = train.departure_time.substring(0, 5); // Get HH:MM
  }
  
  if (train.arrival_time) {
    // arrival_time is now TIME (HH:MM:SS), just format it
    arrivalTime = train.arrival_time.substring(0, 5); // Get HH:MM
  }
  
  // Calculate duration from duration_minutes if available, otherwise calculate from times
  let duration = train.travel_time || '';
  if (!duration && train.duration_minutes) {
    const hours = Math.floor(train.duration_minutes / 60);
    const minutes = train.duration_minutes % 60;
    
    if (hours > 0) {
      duration = `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
    } else {
      duration = `${minutes}m`;
    }
  } else if (!duration && train.departure_time && train.arrival_time) {
    // Fallback: calculate from time strings
    const [depHour, depMin] = train.departure_time.split(':').map(Number);
    const [arrHour, arrMin] = train.arrival_time.split(':').map(Number);
    let durationMinutes = (arrHour * 60 + arrMin) - (depHour * 60 + depMin);
    if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0) {
      duration = `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
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
  
  // Format time - departure_time and arrival_time are now TIME type (HH:MM:SS)
  let time = '';
  let arrivalTime = '';
  
  if (train.departure_time) {
    // departure_time is now TIME (HH:MM:SS), just format it
    time = train.departure_time.substring(0, 5); // Get HH:MM
  }
  
  if (train.arrival_time) {
    // arrival_time is now TIME (HH:MM:SS), just format it
    arrivalTime = train.arrival_time.substring(0, 5); // Get HH:MM
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

// Auth services - Updated to work with AuthContext
export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/login', { email, password });
      
      if (response.token && response.user && typeof window !== 'undefined') {
        // Save auth data using the enhanced storage method
        const expiresAt = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
        const authData = {
          token: response.token,
          user: response.user,
          refreshToken: response.refreshToken,
          expiresAt
        };
        
        localStorage.setItem('auth_data', JSON.stringify(authData));
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Set cookie for middleware (7 days)
        const cookieExpiry = 7 * 24 * 60 * 60;
        document.cookie = `token=${response.token}; path=/; max-age=${cookieExpiry}; secure; samesite=strict`;
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (name: string, email: string, password: string, password_confirmation: string) => {
    try {
      const response = await apiClient.post('/register', { 
        name, 
        email, 
        password, 
        password_confirmation 
      });
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always remove token and user data even if API call fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('backup_token');
        
        // Remove cookie
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
      }
    }
  },
  
  getCurrentUser: () => {
    return apiClient.getCurrentUser();
  },
  
  isLoggedIn: () => {
    return apiClient.isAuthenticated();
  },

  refreshToken: async () => {
    return apiClient.forceRefreshToken();
  }
};

// Station services
export const stationService = {
  getAllStations: async () => {
    try {
      return await apiClient.get('/stations');
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
      const response = await apiClient.get('/trains/search', { params });
      if (Array.isArray(response)) {
        return response.map((train: any) => transformTrainData(train));
      }
      return response;
    } catch (error) {
      console.error('Error searching trains:', error);
      throw error;
    }
  },

  getAllTrains: async () => {
    try {
      return await apiClient.get('/trains/all');
    } catch (error) {
      console.error('Error fetching all trains:', error);
      throw error;
    }
  },
  
  getPromoTrains: async () => {
    try {
      const response = await apiClient.get('/trains/promo');
      if (Array.isArray(response)) {
        return response.map((train: any) => transformTrainData(train));
      }
      return response;
    } catch (error) {
      console.error('Error fetching promo trains:', error);
      throw error;
    }
  },
  
  getAvailableSeats: async (trainId: number, date?: string) => {
    try {
      const params = date ? { date } : {};
      const response = await apiClient.get(`/trains/${trainId}/available-seats`, { params });
      return response.available_seats || [];
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
      return await apiClient.post('/bookings', bookingData);
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },
  
  getBookingHistory: async (userUuid: string) => {
    try {
      return await apiClient.get(`/bookings/history?user_uuid=${userUuid}`);
    } catch (error) {
      console.error('Error fetching booking history:', error);
      throw error;
    }
  },
  
  updateBookingStatus: async (transactionId: string, status: string) => {
    try {
      const response = await apiClient.put(`/bookings/${transactionId}/status`, { status });
      return transformBookingData(response);
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },
  
  cancelBooking: async (transactionId: string) => {
    try {
      return await apiClient.post(`/bookings/${transactionId}/cancel`);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }
};

// Payment services
export const paymentService = {
  // Create Midtrans payment
  createPayment: async (transactionId: string, useQrPayment: boolean = false) => {
    try {
      const response = await apiClient.post('/payments/create', { 
        transaction_id: transactionId,
        use_qr_payment: useQrPayment
      });
      return response;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Check payment status
  checkPaymentStatus: async (transactionId: string) => {
    try {
      const response = await apiClient.get(`/payments/status/${transactionId}`);
      return response;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  },

  // Get payment details from payments table
  getPaymentDetails: async (transactionId: string) => {
    try {
      const response = await apiClient.get(`/payments/details/${transactionId}`);
      return response;
    } catch (error) {
      console.error('Error getting payment details:', error);
      throw error;
    }
  }
};

// Legacy axios instance for backward compatibility
export default apiClient.getAxiosInstance();
