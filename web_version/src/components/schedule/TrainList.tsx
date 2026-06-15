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
      <div className="bg-white rounded-xl shadow-card p-12 text-center">
        <div className="mx-auto w-24 h-24 mb-6 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Hasil</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Maaf, terjadi kesalahan saat memuat data atau tidak ada jadwal yang tersedia saat ini.
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-sm"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (trains.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-12 text-center">
        <div className="mx-auto w-24 h-24 mb-6 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Kereta Ditemukan</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Tidak ada jadwal kereta yang sesuai dengan kriteria pencarian Anda. Coba ubah filter atau tanggal keberangkatan.
        </p>
        <button
          onClick={onResetFilters}
          className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-sm"
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
