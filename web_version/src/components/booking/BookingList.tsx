'use client';

import React from 'react';
import BookingCard from './BookingCard';

// Create train display data from booking, exactly like Flutter implementation
const createTrainFromBooking = (booking: any) => {
  const train = booking.train || {};
  const departureStation = train.departure_station || {};
  const arrivalStation = train.arrival_station || {};

  // Status handling (matching Flutter: displayStatus = statusFromServer.isEmpty ? 'pending' : statusFromServer)
  const statusFromServer = booking.status?.toString() || '';
  const displayStatus = statusFromServer === '' ? 'pending' : statusFromServer;

  // departure_time and arrival_time are now TIME (HH:MM:SS), not TIMESTAMP
  // Use booking.travel_date for date, and train times for time display
  const travelDate = booking.travel_date || new Date().toISOString();
  const departureTime = train.departure_time ? train.departure_time.substring(0, 5) : ''; // Get HH:MM
  const arrivalTime = train.arrival_time ? train.arrival_time.substring(0, 5) : ''; // Get HH:MM

  return {
    id: train.id?.toString() || booking.train_id?.toString() || Math.random().toString(),
    name: train.name || '',
    operator: train.operator || '',
    
    date: travelDate, // Use booking travel date
    time: departureTime, // Use train departure time (HH:MM)
    
    departure: departureStation.name || '',
    arrival: arrivalStation.name || '',
    arrivalTime: arrivalTime,
    duration: train.travel_time || '', 
    classType: train.class_type || '',
    price: train.price?.toString() || '0',
    seatsLeft: train.available_seats || 0, 
    departureStationName: departureStation.name || '', 
    arrivalStationName: arrivalStation.name || '', 
    train_number: train.train_number || '',
  };
};

interface BookingListProps {
  bookings: any[];
  isLoadingAction: boolean;
}

const BookingList: React.FC<BookingListProps> = ({ bookings, isLoadingAction }) => {
  return (
    <div className="space-y-6">
      {bookings.map((booking) => {
        // Log each booking to debug
        console.log('Processing booking:', booking);
        
        const train = createTrainFromBooking(booking);
        const statusFromServer = booking.status?.toString() || '';
        const displayStatus = statusFromServer === '' ? 'pending' : statusFromServer;
        
        return (
          <BookingCard
            key={booking.transaction_id}
            booking={booking}
            train={train}
            displayStatus={displayStatus}
            isLoadingAction={isLoadingAction}
          />
        );
      })}
    </div>
  );
};

export default BookingList;
