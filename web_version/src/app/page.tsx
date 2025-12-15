'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { stationService } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { Station } from '@/types';
import { useToast } from '@/components/Toast';
import FeedbackModal from '@/components/FeedbackModal';
import PromoCarousel from '@/components/PromoCarousel';
import TestimonialSection from '@/components/TestimonialSection';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

import HeroSection from '@/components/home/HeroSection';
import SearchForm from '@/components/home/SearchForm';
import FeaturesSection from '@/components/home/FeaturesSection';
import PopularRoutes from '@/components/home/PopularRoutes';
import FloatingActionButton from '@/components/home/FloatingActionButton';
import AuthButtons from '@/components/home/AuthButtons';

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const searchFormRef = useRef<HTMLDivElement>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedDepartureStation, setSelectedDepartureStation] = useState<Station | null>(null);
  const [selectedArrivalStation, setSelectedArrivalStation] = useState<Station | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [passengerCount, setPassengerCount] = useState(1);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const isLoggedIn = !!user;


  useEffect(() => {
    const fetchStations = async () => {
      setIsLoadingStations(true);
      try {
        const response = await stationService.getAllStations();
        if (response && Array.isArray(response)) {
          setStations(response);
        }
      } catch (error) {
        console.error('Error fetching stations:', error);
      } finally {
        setIsLoadingStations(false);
      }
    };
    
    fetchStations();
  }, []);

  const handleSearchTrains = async () => {
    // Validation
    if (!selectedDepartureStation || !selectedArrivalStation) {
      showToast({
        type: 'warning',
        title: 'Stasiun Belum Dipilih',
        message: 'Silakan pilih stasiun asal dan tujuan terlebih dahulu'
      });
      return;
    }

    if (selectedDepartureStation.id === selectedArrivalStation.id) {
      showToast({
        type: 'error',
        title: 'Stasiun Sama',
        message: 'Stasiun asal dan tujuan tidak boleh sama'
      });
      return;
    }

    setIsSearching(true);

    // Save search to history
    const searchItem = {
      id: Math.random().toString(36).substr(2, 9),
      departure: selectedDepartureStation.name,
      arrival: selectedArrivalStation.name,
      date: selectedDate.toISOString(),
      passengers: passengerCount,
      timestamp: Date.now()
    };

    // Save to localStorage
    const existingHistory = localStorage.getItem('keretaxpress_search_history');
    let history = [];
    if (existingHistory) {
      try {
        history = JSON.parse(existingHistory);
      } catch (error) {
        console.error('Error parsing search history:', error);
      }
    }
    
    // Add new search to beginning and limit to 10 items
    history.unshift(searchItem);
    history = history.slice(0, 10);
    localStorage.setItem('keretaxpress_search_history', JSON.stringify(history));

    // Simulate search delay for better UX
    setTimeout(() => {
      setIsSearching(false);
      showToast({
        type: 'success',
        title: 'Pencarian Berhasil',
        message: 'Mengarahkan ke halaman jadwal kereta...'
      });
      
      router.push(`/schedule?departure=${selectedDepartureStation.id}&arrival=${selectedArrivalStation.id}&date=${selectedDate.toISOString()}&passengers=${passengerCount}`);
    }, 1500);
  };

  const swapStations = () => {
    const temp = selectedDepartureStation;
    setSelectedDepartureStation(selectedArrivalStation);
    setSelectedArrivalStation(temp);
    
    showToast({
      type: 'info',
      title: 'Stasiun Ditukar',
      message: 'Stasiun asal dan tujuan berhasil ditukar'
    });
  };

  const handleSelectSearchHistory = (item: any) => {
    // Find stations by name
    const departureStation = stations.find(s => s.name === item.departure);
    const arrivalStation = stations.find(s => s.name === item.arrival);
    
    if (departureStation) setSelectedDepartureStation(departureStation);
    if (arrivalStation) setSelectedArrivalStation(arrivalStation);
    setSelectedDate(new Date(item.date));
    setPassengerCount(item.passengers);
    setShowSearchHistory(false);
    
    showToast({
      type: 'success',
      title: 'Riwayat Dimuat',
      message: 'Data pencarian sebelumnya berhasil dimuat'
    });
  };

  const handleFeedbackSubmit = (feedback: { rating: number; message: string }) => {
    console.log('Feedback submitted:', feedback);
    
    showToast({
      type: 'success',
      title: 'Terima Kasih!',
      message: 'Feedback Anda sangat berharga untuk kami'
    });
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Hero Section */}
        <HeroSection />

        {/* Enhanced Search Form */}
        <SearchForm
          stations={stations}
          selectedDepartureStation={selectedDepartureStation}
          selectedArrivalStation={selectedArrivalStation}
          selectedDate={selectedDate}
          passengerCount={passengerCount}
          isLoadingStations={isLoadingStations}
          showSearchHistory={showSearchHistory}
          isSearching={isSearching}
          searchFormRef={searchFormRef}
          onDepartureStationChange={setSelectedDepartureStation}
          onArrivalStationChange={setSelectedArrivalStation}
          onDateChange={setSelectedDate}
          onPassengerCountChange={setPassengerCount}
          onSearchHistoryToggle={() => setShowSearchHistory(!showSearchHistory)}
          onSwapStations={swapStations}
          onSearchTrains={handleSearchTrains}
          onSelectSearchHistory={handleSelectSearchHistory}
          onCloseSearchHistory={() => setShowSearchHistory(false)}
        />
        
        {/* Features Section */}
        <FeaturesSection />

        {/* Enhanced Promo Carousel */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-4">Promo Spesial</h2>
            <p className="text-blue-100 text-lg">Jangan lewatkan penawaran menarik untuk perjalanan Anda</p>
          </div>
          <PromoCarousel />
        </div>
        
        {/* Customer Testimonials Section */}
        <div className="mb-16">
          <TestimonialSection />
        </div>
        
        {/* Enhanced Popular Routes Section */}
        <PopularRoutes
          stations={stations}
          onRouteSelect={(departure, arrival, routeName) => {
            if (departure) setSelectedDepartureStation(departure);
            if (arrival) setSelectedArrivalStation(arrival);
            
            showToast({
              type: 'success',
              title: 'Rute Dipilih',
              message: `Rute ${routeName} berhasil dipilih`
            });
          }}
          searchFormRef={searchFormRef}
        />

        {/* Enhanced Floating Action Button */}
        <FloatingActionButton
          onQuickBookClick={() => searchFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
          onSearchClick={() => searchFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
          onHistoryClick={() => setShowSearchHistory(true)}
          onFeedbackClick={() => setShowFeedback(true)}
        />
        
        {/* Auth Buttons (Only show if not logged in) */}
        <AuthButtons isVisible={!isLoggedIn} />
        
        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
          onSubmit={handleFeedbackSubmit}
        />
        
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </div>
  );
}
