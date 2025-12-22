import React from 'react';
import { FiUsers, FiChevronRight, FiMapPin, FiClock, FiStar, FiCalendar } from 'react-icons/fi';
import { Train } from '@/types';
import theme from '@/utils/theme';

interface TrainCardProps {
  train: Train;
  viewMode: 'list' | 'grid';
  isFavorite: boolean;
  onSelect: (train: Train) => void;
  onToggleFavorite: (trainId: string) => void;
}

const TrainCard: React.FC<TrainCardProps> = ({
  train,
  viewMode,
  isFavorite,
  onSelect,
  onToggleFavorite
}) => {
  const isInMaintenance = train.status === 'maintenance';

  const handleCardClick = () => {
    if (!isInMaintenance) {
      onSelect(train);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(train.id);
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm transition-all duration-200 border ${
        isInMaintenance 
          ? 'opacity-75 border-red-200 bg-red-50/30 cursor-not-allowed' 
          : 'hover:shadow-md cursor-pointer border-gray-100 hover:border-blue-200'
      } ${viewMode === 'grid' ? 'p-4' : 'p-6'}`}
      onClick={handleCardClick}
    >
      {/* Maintenance Badge */}
      {isInMaintenance && train.currentMaintenance && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-800">
            <span className="text-lg">🔧</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">Dalam Maintenance</p>
              <p className="text-xs text-red-700">
                {new Date(train.currentMaintenance.start_date).toLocaleDateString('id-ID')} - {new Date(train.currentMaintenance.end_date).toLocaleDateString('id-ID')}
              </p>
              {train.currentMaintenance.reason && (
                <p className="text-xs text-red-600 mt-1">{train.currentMaintenance.reason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Train header with favorite button */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-gray-800 truncate ${viewMode === 'grid' ? 'text-sm' : 'text-base'}`}>
            {train.name}
          </h3>
          <p className={`text-gray-600 truncate ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
            {train.operator}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span 
            className={`px-2 py-1 font-semibold rounded-md whitespace-nowrap ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}
            style={{ 
              backgroundColor: theme.primaryColor + '15', 
              color: theme.primaryColor 
            }}
          >
            {train.classType}
          </span>
          <button
            onClick={handleFavoriteClick}
            className={`p-1 rounded-full transition-colors ${
              isFavorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            <FiStar className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Time and route */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-left min-w-0">
          <div className={`font-bold ${viewMode === 'grid' ? 'text-sm' : 'text-lg'}`} style={{ color: theme.primaryColor }}>
            {train.time}
          </div>
          <div className={`text-gray-600 truncate ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`} title={train.departureStationName}>
            <FiMapPin className="inline h-3 w-3 mr-1" />
            {train.departureStationName}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-2 min-w-0">
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className={`mx-2 text-gray-500 flex items-center whitespace-nowrap ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
            <FiClock className="h-3 w-3 mr-1" />
            {train.duration}
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <div className="text-right min-w-0">
          <div className={`font-bold ${viewMode === 'grid' ? 'text-sm' : 'text-lg'}`} style={{ color: theme.primaryColor }}>
            {train.arrivalTime}
          </div>
          <div className={`text-gray-600 truncate ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`} title={train.arrivalStationName}>
            <FiMapPin className="inline h-3 w-3 mr-1" />
            {train.arrivalStationName}
          </div>
        </div>
      </div>

      {/* Price and seats */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className={`font-bold ${isInMaintenance ? 'text-gray-400' : 'text-green-600'} ${viewMode === 'grid' ? 'text-sm' : 'text-base'}`}>
          {isInMaintenance ? 'Tidak Tersedia' : train.price}
        </div>
        <div className={`flex items-center ${isInMaintenance ? 'text-gray-400' : 'text-gray-500'} ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
          {isInMaintenance ? (
            <span className="text-red-600 font-medium">Tidak Bisa Dipesan</span>
          ) : (
            <>
              <FiUsers className="mr-1 h-3 w-3" />
              <span>{train.seatsLeft} kursi</span>
              <FiChevronRight className="ml-2 h-3 w-3 text-gray-400" />
            </>
          )}
        </div>
      </div>

      {/* Additional info for grid view */}
      {viewMode === 'grid' && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 flex items-center justify-center">
            <FiCalendar className="h-3 w-3 mr-1" />
            {train.date}
          </div>
        </div>
      )}

      {/* Date info for list view */}
      {viewMode === 'list' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-500 flex items-center justify-center">
            <FiCalendar className="h-4 w-4 mr-2" />
            <span>Tanggal Keberangkatan: {train.date}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainCard;
