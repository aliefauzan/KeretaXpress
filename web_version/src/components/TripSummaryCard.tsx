import React from 'react';
import { Train } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';

interface TripSummaryCardProps {
  train: Train;
  travelDate: string;
  selectedSeat?: string;
  showSeat?: boolean;
  className?: string;
}

const TripSummaryCard: React.FC<TripSummaryCardProps> = ({
  train,
  travelDate,
  selectedSeat,
  showSeat = false,
  className = ""
}) => {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-card ${className}`}>
      <h2 className="text-xl font-bold mb-6 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
        Ringkasan Perjalanan
      </h2>
      
      <div className={`grid grid-cols-1 ${showSeat ? 'md:grid-cols-12' : 'md:grid-cols-9'} gap-6`}>
        {/* Train Information */}
        <div className={`${showSeat ? 'md:col-span-4' : 'md:col-span-3'} border-r border-gray-200 pr-6`}>
          <h3 className="text-sm font-medium text-gray-500 uppercase">Kereta Api</h3>
          <p className="font-bold text-xl text-gray-800 mt-2">{train.name}</p>
          <div className="flex items-center mt-1">
            <span className="px-2 py-0.5 bg-blue-100 text-primary text-xs font-medium rounded-full">
              {train.classType}
            </span>
            <span className="text-sm text-gray-500 ml-2">{train.operator}</span>
          </div>
        </div>
        
        {/* Journey Information */}
        <div className={`${showSeat ? 'md:col-span-5' : 'md:col-span-6'} ${showSeat ? 'border-r border-gray-200 pr-6' : ''}`}>
          <h3 className="text-sm font-medium text-gray-500 uppercase">Perjalanan</h3>
          <div className="mt-2 space-y-3">
            <div className="flex">
              <div className="mr-3">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <div className="w-0.5 h-10 bg-gray-300 mx-auto"></div>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Berangkat - {train.time ? formatTime(train.time) : train.departure_time ? formatTime(train.departure_time) : 'Waktu tidak tersedia'}
                </p>
                <p className="font-medium text-gray-800">
                  {train.departureStationName || train.departure_station?.name || train.departure || 'Stasiun tidak tersedia'}
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="mr-3">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Tiba - {train.arrivalTime ? formatTime(train.arrivalTime) : train.arrival_time ? formatTime(train.arrival_time) : 'Waktu tidak tersedia'}
                </p>
                <p className="font-medium text-gray-800">
                  {train.arrivalStationName || train.arrival_station?.name || train.arrival || 'Stasiun tidak tersedia'}
                </p>
              </div>
            </div>
          </div>
          
          <p className="mt-3 text-sm bg-blue-50 text-primary p-1.5 rounded inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {travelDate ? formatDate(travelDate) : train.date ? formatDate(train.date) : 'Tanggal tidak tersedia'}
          </p>
        </div>
        
        {/* Seat and Price Information */}
        {showSeat && (
          <div className="md:col-span-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Kursi & Harga</h3>
            {selectedSeat && (
              <div className="flex items-center space-x-2 mt-2">
                <div className="bg-blue-50 p-2 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1v1a1 1 0 11-2 0v-1H7v1a1 1 0 11-2 0v-1a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-800">Kursi {selectedSeat}</span>
              </div>
            )}
            <p className="font-bold text-xl text-green-600 mt-2">
              {formatCurrency(
                typeof train.price === 'string' 
                  ? Number(train.price.replace(/[^0-9]/g, ''))
                  : Number(train.price || 0)
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripSummaryCard;
