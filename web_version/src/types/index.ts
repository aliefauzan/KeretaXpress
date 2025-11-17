export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  uuid?: string;
}

export interface Train {
  id: string;
  name: string;
  operator: string;
  date: string;
  time: string;
  departure: string;
  arrival: string;
  arrivalTime: string;
  duration: string;
  classType: string;
  price: string;
  seatsLeft: number;
  departureStationName: string;
  arrivalStationName: string;
  // Original backend fields
  train_number?: string;
  departure_station_id?: number;
  arrival_station_id?: number;
  departure_station?: Station;
  arrival_station?: Station;
  departure_time?: string;
  arrival_time?: string;
  available_seats?: number;
  travel_time?: string;
  // Maintenance fields
  departureStationId?: number;
  arrivalStationId?: number;
  status?: string;
  currentMaintenance?: {
    id: number;
    start_date: string;
    end_date: string;
    reason: string;
  } | null;
}

export interface Station {
  id: number;
  name: string;
  city: string;
  code: string;
}

export interface Passenger {
  name: string;
  id_card_number: string;
  phone: string;
}

export interface Booking {
  id: number;
  user_id: number;
  train_id: number;
  transactionId: string; // From backend's transaction_id
  seatNumber: string; // From backend's seat_number
  passengerName: string; // From backend's passenger_name
  passengerIdCard: string; // From backend's passenger_id_card
  passengerPhone: string; // From backend's passenger_phone
  status: string;
  // statusFormatted: string; // Removed, assumed to be frontend derived
  seatClass: string; // From backend's seat_class (specific to this booking)
  passengerId: string; // From backend
  // passengerDob: string; // From backend - ensure these are needed/provided
  // passengerGender: string; // From backend - ensure these are needed/provided
  // booking_date: string; // From backend - if different from created_at
  created_at: string; // From backend
  updated_at: string; // From backend
  train?: Train; // The nested train object from backend. Assumes backend train structure matches frontend Train type.
  total_price: string; // From backend's total_price

  // Removed fields that were for flattened train data, should be sourced from booking.train:
  // date: string;
  // time: string;
  // arrivalTime: string;
  // duration: string;
  // departure: string;
  // arrival: string;
  // price: string; // Replaced by total_price for the booking's total
  // trainName: string;
  // operator: string;
  // classType: string; // Use booking.seatClass or booking.train.classType

  // Original backend fields from comments can be cleaned if primary fields cover them
  transaction_id?: string; // Covered by transactionId
  seat_number?: string; // Covered by seatNumber
  passenger_name?: string; // Covered by passengerName
  passenger_id_card?: string; // Covered by passengerIdCard
  passenger_phone?: string; // Covered by passengerPhone
}

// Transformed booking data for display
export interface BookingDisplay {
  transactionId: string;
  trainName: string;
  operator: string;
  date: string;
  time: string;
  departure: string;
  arrival: string;
  arrivalTime: string;
  status: string;
  price: string;
  passengerName: string;
  passengerId: string;
  passengerDob: string;
  passengerGender: string;
  seatClass: string;
  seatNumber: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Payment {
  id: number;
  booking_id: number;
  transaction_id?: string; // From joined bookings table
  payment_type: string;
  payment_method: string;
  amount: number;
  status: string;
  order_id: string;
  payment_data?: {
    qr_code_url?: string;
    deeplink?: string;
    payment_type?: string;
    expiry_time?: string;
    transaction_id?: string;
    order_id?: string;
    transaction_time?: string;
    transaction_status?: string;
    actions?: any[];
    [key: string]: any;
  };
  paid_at?: string;
  expired_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentResponse {
  transaction_id: string;
  snap_token?: string;
  redirect_url?: string;
  booking: any;
  existing_payment?: boolean;
  use_core_api?: boolean;
  payment_type?: string;
  qr_code_url?: string;
  deeplink?: string;
  expiry_time?: string;
  payment_code?: string;
  va_numbers?: any[];
  bill_key?: string;
  biller_code?: string;
  permata_va_number?: string;
  pdf_url?: string;
  transaction_time?: string;
  midtrans_status?: string;
  payment_data?: any;
  message?: string;
}
