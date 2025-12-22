import React from 'react';
import { FiFilter, FiRefreshCw } from 'react-icons/fi';
import { MdOutlineCompareArrows } from 'react-icons/md';
import { Station } from '@/types';
import { TRAIN_CLASSES, SORT_OPTIONS } from '@/constants';

interface ScheduleFiltersProps {
  stations: Station[];
  departureStationId: number | null;
  arrivalStationId: number | null;
  selectedDate: string;
  searchQuery: string;
  trainClassFilter: string;
  sortBy: 'time' | 'price' | 'duration' | 'seats';
  sortOrder: 'asc' | 'desc';
  showFilters: boolean;
  priceRange: { min: number; max: number };
  viewMode: 'list' | 'grid';
  onDepartureStationChange: (stationId: number) => void;
  onArrivalStationChange: (stationId: number) => void;
  onDateChange: (date: string) => void;
  onSearchQueryChange: (query: string) => void;
  onTrainClassFilterChange: (classType: string) => void;
  onSortByChange: (sortBy: 'time' | 'price' | 'duration' | 'seats') => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  onToggleFilters: () => void;
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onSwapStations: () => void;
  onSearch: (e: React.FormEvent) => void;
  onRefresh: () => void;
}

const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
  stations,
  departureStationId,
  arrivalStationId,
  selectedDate,
  searchQuery,
  trainClassFilter,
  sortBy,
  sortOrder,
  showFilters,
  priceRange,
  viewMode,
  onDepartureStationChange,
  onArrivalStationChange,
  onDateChange,
  onSearchQueryChange,
  onTrainClassFilterChange,
  onSortByChange,
  onSortOrderChange,
  onToggleFilters,
  onPriceRangeChange,
  onViewModeChange,
  onSwapStations,
  onSearch,
  onRefresh
}) => {
  return (
    <div className="bg-white rounded-xl shadow-card p-6 mb-6">
      {/* Main Search Form */}
      <form onSubmit={onSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Departure Station */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Stasiun Keberangkatan</label>
            <select
              value={departureStationId || ''}
              onChange={(e) => onDepartureStationChange(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
            >
              <option value="">Semua Stasiun</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex items-end justify-center">
            <button
              type="button"
              onClick={onSwapStations}
              className="p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              title="Tukar stasiun"
            >
              <MdOutlineCompareArrows className="h-5 w-5" />
            </button>
          </div>

          {/* Arrival Station */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Stasiun Tujuan</label>
            <select
              value={arrivalStationId || ''}
              onChange={(e) => onArrivalStationChange(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
            >
              <option value="">Semua Stasiun</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Keberangkatan</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pencarian</label>
            <input
              type="text"
              placeholder="Cari nama kereta, operator..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-primary px-6 py-3 rounded-lg font-medium"
            >
              Cari Kereta
            </button>
            
            <button
              type="button"
              onClick={onToggleFilters}
              className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
              }`}
            >
              <FiFilter className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-primary transition-colors"
            >
              <FiRefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Train Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kelas Kereta</label>
              <select
                value={trainClassFilter}
                onChange={(e) => onTrainClassFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {TRAIN_CLASSES.map((classType) => (
                  <option key={classType} value={classType}>
                    {classType}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urutkan Berdasarkan</label>
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value as 'time' | 'price' | 'duration' | 'seats')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urutan</label>
              <select
                value={sortOrder}
                onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="asc">Naik</option>
                <option value="desc">Turun</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tampilan</label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => onViewModeChange('list')}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('grid')}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rentang Harga: Rp {priceRange.min.toLocaleString()} - Rp {priceRange.max.toLocaleString()}
            </label>
            <div className="flex gap-4">
              <input
                type="range"
                min="0"
                max="1000000"
                step="50000"
                value={priceRange.min}
                onChange={(e) => onPriceRangeChange({ ...priceRange, min: Number(e.target.value) })}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="1000000"
                step="50000"
                value={priceRange.max}
                onChange={(e) => onPriceRangeChange({ ...priceRange, max: Number(e.target.value) })}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleFilters;
