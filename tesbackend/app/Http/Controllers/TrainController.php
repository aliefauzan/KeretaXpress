<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Train;
use App\Services\SupabaseService;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Http;

class TrainController extends Controller
{
    protected $supabase;
    
    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }
    
    public function search(Request $request)
    {
        try {
            $request->validate([
                'departure_station' => 'required|exists:stations,id',
                'arrival_station' => 'required|exists:stations,id|different:departure_station',
                'date' => 'required|date|after_or_equal:today',
            ]);
            
            // Hybrid query - Laravel Eloquent with Supabase realtime
            $trains = Train::with(['departureStation', 'arrivalStation'])
                ->where('departure_station_id', $request->departure_station)
                ->where('arrival_station_id', $request->arrival_station)
                ->whereDate('departure_time', $request->date)
                ->where('available_seats', '>', 0)
                ->orderBy('departure_time')
                ->get();
                
            if ($trains->isEmpty()) {
                return response()->json([
                    'message' => 'No trains found for the selected criteria',
                    'trains' => []
                ], 200);
            }
                
            return response()->json([
                'trains' => $trains
            ], 200);
        } catch (ValidationException $e) {
            Log::warning('Train search validation failed', [
                'errors' => $e->errors(),
                'request' => $request->all()
            ]);
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Train search error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json(['error' => 'An error occurred while searching for trains'], 500);
        }
    }
    
    public function getPromoTrains()
    {
        try {
            // Use Supabase REST API directly for promo trains
            $url = $this->supabase->baseUrl . "/rest/v1/trains?select=*,departure_station_id(*),arrival_station_id(*)&available_seats=gt.10&is_promo=eq.true&order=price.asc&limit=3";
            $response = Http::withHeaders($this->supabase->headers())->get($url);
            $data = $response->json();
            if (empty($data)) {
                return response()->json([
                    'message' => 'No promotional trains available',
                    'trains' => []
                ], 200);
            }
            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Promo trains fetch error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'An error occurred while fetching promotional trains'], 500);
        }
    }

    public function allTrains()
    {
        try {
            $trains = Train::with(['departureStation', 'arrivalStation'])
                ->orderBy('departure_time')
                ->get();
                
            if ($trains->isEmpty()) {
                return response()->json([
                    'message' => 'No trains available',
                    'trains' => []
                ], 200);
            }
                
            return response()->json(['trains' => $trains]);
        } catch (\Exception $e) {
            Log::error('All trains fetch error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'An error occurred while fetching trains'], 500);
        }
    }

    public function availableSeats(Request $request, $id)
    {
        $train = Train::findOrFail($id);
        $date = $request->query('date');
        if (!$date) {
            return response()->json(['error' => 'Date is required'], 400);
        }
        // Generate seats from A1 to A{available_seats} based on train's available_seats count
        $allSeats = collect(range(1, $train->available_seats))->map(fn(
          $n) => 'A' . $n)->toArray();
        $bookedSeats = \App\Models\Booking::where('train_id', $id)
            ->where('travel_date', $date)
            ->pluck('seat_number')
            ->toArray();
        $availableSeats = array_values(array_diff($allSeats, $bookedSeats));
        return response()->json(['available_seats' => $availableSeats]);
    }
}
