'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TripSummaryCard from '@/components/TripSummaryCard';
import Modal from '@/components/ui/Modal';
import { trainService } from '@/utils/api';
import { Train } from '@/types';
import SeatSelectionSkeleton from '@/components/skeletons/SeatSelectionSkeleton';
import SeatLegend from '@/components/seat-selection/SeatLegend';
import SeatMap from '@/components/seat-selection/SeatMap';
import SelectionSummary from '@/components/seat-selection/SelectionSummary';
import NoSeatsAvailable from '@/components/seat-selection/NoSeatsAvailable';
import TrainNotFound from '@/components/seat-selection/TrainNotFound';

export default function SeatSelectionPage() {
  const router = useRouter();
  const [train, setTrain] = useState<Train | null>(null);
  const [travelDate, setTravelDate] = useState<string>('');
  const [availableSeats, setAvailableSeats] = useState<string[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [showAlertModal, setShowAlertModal] = useState(false);

  useEffect(() => {
    const storedTrainJSON = sessionStorage.getItem('selectedTrain');
    const storedDate = sessionStorage.getItem('travelDate');
    
    if (!storedTrainJSON || !storedDate) {
      console.warn("Missing train data or date in session storage. Redirecting to schedule.");
      router.push('/schedule');
      return;
    }
    
    let parsedTrainData: Train | null = null;
    try {
      parsedTrainData = JSON.parse(storedTrainJSON);
    } catch (e) {
      console.error("Failed to parse train data from session storage:", e);
      router.push('/schedule');
      return;
    }

    if (!parsedTrainData || !parsedTrainData.id) {
        console.error("Parsed train data is invalid or missing ID. Redirecting to schedule.");
        setTrain(null); 
        setTravelDate('');
        setAvailableSeats([]);
        // setIsLoading(false); // Not strictly needed if redirecting immediately
        router.push('/schedule');
        return;
    }

    setTrain(parsedTrainData);
    setTravelDate(storedDate);
    
    const fetchSeatsForTrain = async (trainId: string, date: string) => {
      // setIsLoading(true); // isLoading is already true from initial state
      try {
        const seats = await trainService.getAvailableSeats(Number(trainId), date);
        if (Array.isArray(seats)) {
          setAvailableSeats(seats);
        } else {
          console.warn('Available seats response is not an array:', seats);
          setAvailableSeats([]);
        }
      } catch (error) {
        console.error('Error fetching available seats:', error);
        setAvailableSeats([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSeatsForTrain(parsedTrainData.id, storedDate);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Changed dependency array to [] for mount-only effect

  const handleSeatClick = (seat: string) => {
    setSelectedSeat(seat);
  };

  const handleContinue = () => {
    if (!selectedSeat) {
      setShowAlertModal(true);
      return;
    }
    
    // Store selected seat in sessionStorage
    sessionStorage.setItem('selectedSeat', selectedSeat);
    
    // Navigate to passenger information page
    router.push('/passenger-info');
  };
  if (isLoading) {
    return <SeatSelectionSkeleton />;
  }
  if (!train) {
    return <TrainNotFound onBackToSchedule={() => router.push('/schedule')} />;
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-white drop-shadow-lg">Pilih Kursi Anda</h1>          {/* Trip Summary Card */}
        <TripSummaryCard 
          train={train} 
          travelDate={travelDate} 
          selectedSeat={selectedSeat}
          showSeat={true}
          className="mb-8"
        />          {/* Seat Selection */}
        <div className="bg-white p-6 rounded-xl shadow-card mb-8">
          {availableSeats.length === 0 ? (
            <NoSeatsAvailable />
          ) : (
            <>
              <SeatLegend 
                availableCount={Math.min(
                  Array.isArray(availableSeats) 
                    ? availableSeats.filter(seat => {
                        const seatNum = parseInt(seat.substring(1));
                        return seat.startsWith('A') && !isNaN(seatNum) && seatNum <= 100;
                      }).length 
                    : 0, 
                  100
                )} 
              />
              
              <SeatMap
                availableSeats={availableSeats}
                selectedSeat={selectedSeat}
                onSeatClick={handleSeatClick}
              />
              
              <SelectionSummary
                selectedSeat={selectedSeat}
                onContinue={handleContinue}
              />
            </>
          )}
        </div>
      </div>

      {/* Alert Modal */}
      <Modal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title="Perhatian"
        message="Silakan pilih kursi terlebih dahulu."
        type="alert"
        confirmText="OK"
      />
    </div>
  );
}
