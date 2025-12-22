import { useRef } from 'react';
import { FiCalendar, FiSearch } from 'react-icons/fi';
import { FaTrain, FaUsers } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { Station } from '@/types';
import AnimatedCard from '@/components/AnimatedCard';
import SearchHistory from '@/components/SearchHistory';
import LoadingSkeleton from '@/components/LoadingSkeleton';

interface SearchFormProps {
  stations: Station[];
  selectedDepartureStation: Station | null;
  selectedArrivalStation: Station | null;
  selectedDate: Date;
  passengerCount: number;
  isLoadingStations: boolean;
  showSearchHistory: boolean;
  isSearching: boolean;
  searchFormRef?: React.RefObject<HTMLDivElement>;
  onDepartureStationChange: (station: Station | null) => void;
  onArrivalStationChange: (station: Station | null) => void;
  onDateChange: (date: Date) => void;
  onPassengerCountChange: (count: number) => void;
  onSearchHistoryToggle: () => void;
  onSwapStations: () => void;
  onSearchTrains: () => void;
  onSelectSearchHistory: (item: any) => void;
  onCloseSearchHistory: () => void;
}

export default function SearchForm({
  stations,
  selectedDepartureStation,
  selectedArrivalStation,
  selectedDate,
  passengerCount,
  isLoadingStations,
  showSearchHistory,
  isSearching,
  searchFormRef,
  onDepartureStationChange,
  onArrivalStationChange,
  onDateChange,
  onPassengerCountChange,
  onSearchHistoryToggle,
  onSwapStations,
  onSearchTrains,
  onSelectSearchHistory,
  onCloseSearchHistory,
}: SearchFormProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const formRef = searchFormRef || internalRef;

  return (
    <AnimatedCard className="mb-12" delay={0.2}>
      <div ref={formRef} className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FaTrain className="text-blue-600 text-xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Cari Jadwal Kereta</h2>
          </div>
          
          {/* Search History Button */}
          <button
            onClick={onSearchHistoryToggle}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiSearch className="w-4 h-4" />
            Riwayat
          </button>
        </div>
      
        {isLoadingStations ? (
          <div className="space-y-6">
            <LoadingSkeleton className="h-16" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LoadingSkeleton className="h-16" />
              <LoadingSkeleton className="h-16" />
            </div>
            <LoadingSkeleton type="button" className="w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Station Selection with Swap */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
              <div className="lg:col-span-2">
                <label htmlFor="departure" className="block text-sm font-semibold text-gray-700 mb-2">Stasiun Asal</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaTrain className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    id="departure"
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-800 font-medium"
                    value={selectedDepartureStation?.id || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const station = stations.find(s => Number(s.id) === val);
                      onDepartureStationChange(station || null);
                    }}
                  >
                    <option value="">Pilih Stasiun Asal</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Swap Button */}
              <div className="flex justify-center lg:col-span-1">
                <button
                  onClick={onSwapStations}
                  disabled={!selectedDepartureStation || !selectedArrivalStation}
                  className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/90 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-secondary group mt-4"
                  title="Tukar stasiun"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white group-disabled:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              </div>
              
              <div className="lg:col-span-2">
                <label htmlFor="arrival" className="block text-sm font-semibold text-gray-700 mb-2">Stasiun Tujuan</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaTrain className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    id="arrival"
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-800 font-medium"
                    value={selectedArrivalStation?.id || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const station = stations.find(s => Number(s.id) === val);
                      onArrivalStationChange(station || null);
                    }}
                  >
                    <option value="">Pilih Stasiun Tujuan</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Date and Passenger Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Berangkat</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiCalendar className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => date && onDateChange(date)}
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-800 font-medium"
                  />
                </div>
                {/* Quick Date Buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => onDateChange(new Date())}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-gray-600 hover:text-gray-800"
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      onDateChange(tomorrow);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-gray-600 hover:text-gray-800"
                  >
                    Besok
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="passengers" className="block text-sm font-semibold text-gray-700 mb-2">Jumlah Penumpang</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUsers className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    id="passengers"
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-800 font-medium"
                    value={passengerCount}
                    onChange={(e) => onPassengerCountChange(parseInt(e.target.value))}
                  >
                    {[1,2,3,4,5,6].map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Penumpang' : 'Penumpang'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <button
              onClick={onSearchTrains}
              disabled={isSearching || !selectedDepartureStation || !selectedArrivalStation}
              className="w-full py-4 px-6 text-white font-bold text-lg rounded-xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-xl transform hover:scale-[1.02] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center gap-3">
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>MENCARI KERETA...</span>
                  </>
                ) : (
                  <>
                    <FaTrain className="text-xl" />
                    <span>CARI KERETA SEKARANG</span>
                  </>
                )}
              </div>
            </button>
          </div>
        )}
        
        {/* Search History Component */}
        <SearchHistory
          isVisible={showSearchHistory}
          onSelectHistory={onSelectSearchHistory}
          onClose={onCloseSearchHistory}
        />
      </div>
    </AnimatedCard>
  );
}
