import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { MdOutlineCompareArrows, MdSwapVert } from 'react-icons/md';
import theme from '@/utils/theme';

interface ScheduleControlsProps {
  searchQuery: string;
  sortBy: 'time' | 'price' | 'duration' | 'seats';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid';
  onSearchQueryChange: (query: string) => void;
  onSortByChange: (sortBy: 'time' | 'price' | 'duration' | 'seats') => void;
  onSortOrderToggle: () => void;
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onRefresh: () => void;
}

const ScheduleControls: React.FC<ScheduleControlsProps> = ({
  searchQuery,
  sortBy,
  sortOrder,
  viewMode,
  onSearchQueryChange,
  onSortByChange,
  onSortOrderToggle,
  onViewModeChange,
  onRefresh
}) => {
  return (
    <div className="mb-12 space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Cari kereta, stasiun, atau operator..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-800 font-medium"
        />
      </div>

      {/* Sort Controls and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <label className="text-lg font-semibold text-white">Urutkan:</label>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'time' | 'price' | 'duration' | 'seats')}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-800 font-medium"
            >
              <option value="time">Waktu</option>
              <option value="price">Harga</option>
              <option value="duration">Durasi</option>
              <option value="seats">Kursi Tersisa</option>
            </select>
            
            <button
              onClick={onSortOrderToggle}
              className="p-3 border-2 border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all duration-200 bg-white hover:border-gray-300"
              title={`Urutan ${sortOrder === 'asc' ? 'Naik' : 'Turun'}`}
            >
              <MdSwapVert className={`h-6 w-6 text-gray-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-6 py-3 transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-6 py-3 transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          {/* Show All Trains Button */}
          <button
            onClick={onRefresh}
            className="px-6 py-3 font-semibold rounded-xl border-2 hover:bg-blue-50 transition-all duration-200 hover:shadow-md flex items-center gap-2 shadow-sm bg-white"
            style={{ 
              color: theme.primaryColor, 
              borderColor: theme.primaryColor,
              minWidth: 'fit-content'
            }}
          >
            <FiRefreshCw className="h-5 w-5" />
            Tampilkan Semua
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleControls;
