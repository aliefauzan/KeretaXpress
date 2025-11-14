'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiUsers, FiChevronRight, FiFilter, FiRefreshCw, FiMapPin, FiClock, FiStar, FiCalendar } from 'react-icons/fi';
import { FaTrain } from 'react-icons/fa';
import { MdOutlineCompareArrows } from 'react-icons/md';
import { trainService, stationService } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { Train, Station } from '@/types';
import { formatCurrency } from '@/utils/format';
import theme from '@/utils/theme';
import ScheduleSkeleton from '@/components/skeletons/ScheduleSkeleton';
import ScheduleFilters from '@/components/schedule/ScheduleFilters';
import ScheduleControls from '@/components/schedule/ScheduleControls';
import TrainList from '@/components/schedule/TrainList';
import ResultsSummary from '@/components/schedule/ResultsSummary';
import RecentSearches from '@/components/schedule/RecentSearches';

function SchedulePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [trains, setTrains] = useState<Train[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [departureStationId, setDepartureStationId] = useState<number | null>(null);
  const [arrivalStationId, setArrivalStationId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showAllTrains, setShowAllTrains] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [trainClassFilter, setTrainClassFilter] = useState('Semua');
  
  // Enhanced features
  const [sortBy, setSortBy] = useState<'time' | 'price' | 'duration' | 'seats'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [favoriteTrains, setFavoriteTrains] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const fetchStations = useCallback(async () => {
    try {
      const response = await stationService.getAllStations();
      if (response && Array.isArray(response)) {
        setStations(response);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  }, []);
  const fetchAllTrains = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await trainService.getAllTrains();      if (response && response.trains && Array.isArray(response.trains)) {
        const transformedTrains = response.trains.map((train: any) => ({
          id: train.id,
          name: train.name || '',
          operator: train.operator || '',
          classType: train.class_type || '',
          price: train.price ? formatCurrency(parseInt(train.price)) : '',
          seatsLeft: train.available_seats || 0,
          // departure_time and arrival_time are now TIME (HH:MM:SS), not TIMESTAMP
          time: train.departure_time ? train.departure_time.substring(0, 5) : '',
          arrivalTime: train.arrival_time ? train.arrival_time.substring(0, 5) : '',
          // Preserve raw time fields for format functions
          departure_time: train.departure_time || '',
          arrival_time: train.arrival_time || '',
          // Backend returns flat fields: departure_station_name and arrival_station_name
          departureStationName: train.departure_station_name || train.departure_station?.name || '',
          arrivalStationName: train.arrival_station_name || train.arrival_station?.name || '',
          departure: train.departure_station_name || train.departure_station?.name || '',
          arrival: train.arrival_station_name || train.arrival_station?.name || '',
          duration: train.duration_minutes ? `${Math.floor(train.duration_minutes / 60)}h ${train.duration_minutes % 60}m` : '',
          date: '' // Trains don't have specific dates anymore
        }));
        setTrains(transformedTrains);
        setShowAllTrains(true);
      } else {
        setTrains([]);
        setError('Tidak ada kereta yang tersedia');
      }
    } catch (error) {
      console.error('Error fetching all trains:', error);
      setError('Terjadi kesalahan saat memuat jadwal kereta');
      setTrains([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchTrains = useCallback(async (departureId: number, arrivalId: number, date: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const formattedDate = date.toISOString().split('T')[0];      const response = await trainService.searchTrains({
        departure_station_id: departureId,
        arrival_station_id: arrivalId,
        date: formattedDate,
      });      if (response && response.trains && Array.isArray(response.trains)) {
        const transformedTrains = response.trains.map((train: any) => ({
          id: train.id,
          name: train.name || '',
          operator: train.operator || '',
          classType: train.class_type || '',
          price: train.price ? formatCurrency(parseInt(train.price)) : '',
          seatsLeft: train.available_seats || 0,
          // departure_time and arrival_time are now TIME (HH:MM:SS), not TIMESTAMP
          time: train.departure_time ? train.departure_time.substring(0, 5) : '',
          arrivalTime: train.arrival_time ? train.arrival_time.substring(0, 5) : '',
          // Preserve raw time fields for format functions
          departure_time: train.departure_time || '',
          arrival_time: train.arrival_time || '',
          // Backend returns flat fields: departure_station_name and arrival_station_name
          departureStationName: train.departure_station_name || train.departure_station?.name || '',
          arrivalStationName: train.arrival_station_name || train.arrival_station?.name || '',
          departure: train.departure_station_name || train.departure_station?.name || '',
          arrival: train.arrival_station_name || train.arrival_station?.name || '',
          duration: train.duration_minutes ? `${Math.floor(train.duration_minutes / 60)}h ${train.duration_minutes % 60}m` : '',
          date: formattedDate // Use the search date
        }));
        setTrains(transformedTrains);
        setShowAllTrains(false);
      } else {
        setTrains([]);
        setError('Tidak ada kereta yang ditemukan untuk rute dan tanggal yang dipilih');
      }
    } catch (error) {
      console.error('Error searching trains:', error);
      setError('Terjadi kesalahan saat mencari jadwal kereta');
      setTrains([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (departureStationId && arrivalStationId && selectedDate) {
      // Save search to recent searches
      saveSearch(departureStationId, arrivalStationId, selectedDate);
      searchTrains(departureStationId, arrivalStationId, new Date(selectedDate));
    }
  };  useEffect(() => {
    const departure = searchParams.get('departure');
    const arrival = searchParams.get('arrival');
    const date = searchParams.get('date');

    fetchStations();

    if (departure && arrival && date) {
      setDepartureStationId(Number(departure));
      setArrivalStationId(Number(arrival));
      setSelectedDate(new Date(date).toISOString().split('T')[0]);
      setShowAllTrains(false);
      searchTrains(Number(departure), Number(arrival), new Date(date));
    } else {
      setSelectedDate(new Date().toISOString().split('T')[0]);
      fetchAllTrains();
    }
  }, [searchParams, fetchStations, fetchAllTrains, searchTrains]);

  useEffect(() => {
    const departure = searchParams.get('departure');
    const arrival = searchParams.get('arrival');
    
    if (!departure && !arrival && stations.length > 1 && !departureStationId && !arrivalStationId) {
      setDepartureStationId(stations[0].id);
      setArrivalStationId(stations[1].id);
    }
  }, [stations, searchParams, departureStationId, arrivalStationId]);  const handleSelectTrain = (train: Train) => {
    const isLoggedIn = !!user;
    
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    
    // Store train data and travel date in session storage
    sessionStorage.setItem('selectedTrain', JSON.stringify(train));
    sessionStorage.setItem('travelDate', selectedDate);
    
    // Navigate to seat selection page
    router.push('/seat-selection');
  };
  // Enhanced filtering and sorting functionality
  const filteredAndSortedTrains = trains
    .filter((train) => {
      const query = searchQuery.toLowerCase();
      const matchesClass = trainClassFilter === 'Semua' || train.classType === trainClassFilter;
      const matchesSearch = train.name.toLowerCase().includes(query) ||
                           train.departureStationName.toLowerCase().includes(query) ||
                           train.arrivalStationName.toLowerCase().includes(query) ||
                           train.operator.toLowerCase().includes(query);
      
      // Departure station filter - compare IDs ensuring both are numbers
      const matchesDeparture = !departureStationId || showAllTrains || 
        (train.departureStationId && (
          typeof train.departureStationId === 'string' 
            ? parseInt(train.departureStationId) === departureStationId
            : train.departureStationId === departureStationId
        ));
      
      // Arrival station filter - compare IDs ensuring both are numbers
      const matchesArrival = !arrivalStationId || showAllTrains || 
        (train.arrivalStationId && (
          typeof train.arrivalStationId === 'string' 
            ? parseInt(train.arrivalStationId) === arrivalStationId
            : train.arrivalStationId === arrivalStationId
        ));
      
      // Price range filter
      const price = parseInt(train.price.replace(/\D/g, ''));
      const matchesPrice = price >= priceRange.min && price <= priceRange.max;
      
      return matchesClass && matchesSearch && matchesDeparture && matchesArrival && matchesPrice;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          const priceA = parseInt(a.price.replace(/\D/g, ''));
          const priceB = parseInt(b.price.replace(/\D/g, ''));
          comparison = priceA - priceB;
          break;
        case 'duration':
          const durationA = parseInt(a.duration.split('h')[0]) * 60 + parseInt(a.duration.split('h')[1]?.replace('m', '') || '0');
          const durationB = parseInt(b.duration.split('h')[0]) * 60 + parseInt(b.duration.split('h')[1]?.replace('m', '') || '0');
          comparison = durationA - durationB;
          break;
        case 'seats':
          comparison = a.seatsLeft - b.seatsLeft;
          break;
        case 'time':
        default:
          comparison = a.time.localeCompare(b.time);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Handle station swapping
  const handleSwapStations = () => {
    const tempDeparture = departureStationId;
    setDepartureStationId(arrivalStationId);
    setArrivalStationId(tempDeparture);
  };

  // Handle favorite toggle
  const toggleFavorite = (trainId: string) => {
    setFavoriteTrains(prev => 
      prev.includes(trainId) 
        ? prev.filter(id => id !== trainId)
        : [...prev, trainId]
    );
  };

  // Save search to recent searches
  const saveSearch = (departure: number, arrival: number, date: string) => {
    const departureStation = stations.find(s => s.id === departure);
    const arrivalStation = stations.find(s => s.id === arrival);
    
    if (departureStation && arrivalStation) {
      const newSearch = {
        id: Date.now(),
        departure: departureStation.name,
        arrival: arrivalStation.name,
        date,
        timestamp: new Date().toISOString()
      };
      
      setRecentSearches(prev => [newSearch, ...prev.slice(0, 4)]);
    }
  };return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">      {/* Enhanced Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-white mb-2 drop-shadow-lg">
          Pilih Jadwal Keberangkatan
        </h1>
        <p className="text-center text-blue-100">
          Temukan jadwal kereta yang sesuai dengan perjalanan Anda
        </p>
      </div>      {/* Enhanced Search Filter */}
      <div className="mb-12">
        <ScheduleFilters
          stations={stations}
          departureStationId={departureStationId}
          arrivalStationId={arrivalStationId}
          selectedDate={selectedDate}
          searchQuery={searchQuery}
          trainClassFilter={trainClassFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          showFilters={showFilters}
          priceRange={priceRange}
          viewMode={viewMode}
          onDepartureStationChange={setDepartureStationId}
          onArrivalStationChange={setArrivalStationId}
          onDateChange={setSelectedDate}
          onSearchQueryChange={setSearchQuery}
          onTrainClassFilterChange={setTrainClassFilter}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onPriceRangeChange={setPriceRange}
          onViewModeChange={setViewMode}
          onSwapStations={handleSwapStations}
          onSearch={handleSearch}
          onRefresh={() => {
            setSearchQuery('');
            setTrainClassFilter('Semua');
            setShowAllTrains(true);
            setPriceRange({ min: 0, max: 1000000 });
            fetchAllTrains();
          }}
        />
      </div>      <RecentSearches
        recentSearches={recentSearches}
        stations={stations}
        onSearchSelect={(departureId, arrivalId, date) => {
          setDepartureStationId(departureId);
          setArrivalStationId(arrivalId);
          setSelectedDate(date);
        }}
      />{/* Search and Controls */}
      <div className="mb-12">
        <ScheduleControls
          searchQuery={searchQuery}
          sortBy={sortBy}
          sortOrder={sortOrder}
          viewMode={viewMode}          onSearchQueryChange={setSearchQuery}
          onSortByChange={setSortBy}
          onSortOrderToggle={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          onViewModeChange={setViewMode}
          onRefresh={() => {
            setSearchQuery('');
            setTrainClassFilter('Semua');
            setShowAllTrains(true);
            setPriceRange({ min: 0, max: 1000000 });
            fetchAllTrains();
          }}
        />
      </div>

      {/* Results Summary */}
      {!isLoading && !error && filteredAndSortedTrains.length > 0 && (        <ResultsSummary
          totalResults={trains.length}
          filteredResults={filteredAndSortedTrains.length}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      )}

      {/* Enhanced Train List */}      <TrainList
        trains={filteredAndSortedTrains}
        isLoading={isLoading}
        error={error}
        viewMode={viewMode}
        favoriteTrains={favoriteTrains}
        onSelectTrain={handleSelectTrain}
        onToggleFavorite={toggleFavorite}
        onRetry={fetchAllTrains}
        onResetFilters={() => {
          setSearchQuery('');
          setTrainClassFilter('Semua');
          setPriceRange({ min: 0, max: 1000000 });
          fetchAllTrains();
        }}
      /></div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleSkeleton />}>
      <SchedulePageContent />
    </Suspense>
  );
}
