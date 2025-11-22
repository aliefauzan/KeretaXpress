import React from 'react';
import { Train } from '@/types';
import TrainCard from './TrainCard';
import ScheduleSkeleton from '@/components/skeletons/ScheduleSkeleton';

interface TrainListProps {
  trains: Train[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'list' | 'grid';
  favoriteTrains: string[];
  onSelectTrain: (train: Train) => void;
  onToggleFavorite: (trainId: string) => void;
  onRetry: () => void;
  onResetFilters: () => void;
}

const TrainList: React.FC<TrainListProps> = ({
  trains,
  isLoading,
  error,
  viewMode,
  favoriteTrains,
  onSelectTrain,
  onToggleFavorite,
  onRetry,
  onResetFilters
}) => {
  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  // Don't show error UI here - errors are handled via Toast notifications
  // Just show empty state if there's an error and no trains
  if (error && trains.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto w-24 h-24 mb-4 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.7-2.6M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Hasil</h3>
        <p className="text-gray-600 mb-4">
          Coba ubah kriteria pencarian Anda
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Lihat Semua Kereta
        </button>
      </div>
    );
  }

  if (trains.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto w-24 h-24 mb-4 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.7-2.6M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Kereta Ditemukan</h3>
        <p className="text-gray-600 mb-4">
          Tidak ada kereta yang sesuai dengan filter yang dipilih
        </p>
        <button
          onClick={onResetFilters}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reset Filter
        </button>
      </div>
    );
  }

  return (
    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}`}>
      {trains.map((train: Train) => (
        <TrainCard
          key={`${train.id}-${train.status}-${train.currentMaintenance?.id || 'none'}`}
          train={train}
          viewMode={viewMode}
          isFavorite={favoriteTrains.includes(train.id)}
          onSelect={onSelectTrain}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

export default TrainList;
