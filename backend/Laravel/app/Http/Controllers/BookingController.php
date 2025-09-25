<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Train;
use App\Services\SupabaseService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    protected $supabase;
    
    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }
    
    public function book(Request $request)
    {
        try {
            $request->validate([
                'user_uuid' => 'required|uuid|exists:users,uuid',
                'train_id' => 'required|exists:trains,id',
                'travel_date' => 'required|date',
                'passenger_name' => 'required|string|min:3',
                'passenger_id_number' => 'required|string',
                'passenger_dob' => 'required|date',
                'passenger_gender' => 'required|in:male,female',
                'payment_method' => 'required|in:transfer',
                'seat_number' => 'required|string',
            ]);
            
            $booking = DB::transaction(function () use ($request) {
                $train = Train::lockForUpdate()->findOrFail($request->train_id);

                if ($train->available_seats <= 0) {
                    throw new \Exception('No available seats for this train');
                }

                $train->available_seats -= 1;
                $train->save();

                return Booking::create([
                    'transaction_id' => 'KX-' . Str::random(10),
                    'user_uuid' => $request->user_uuid,
                    'train_id' => $train->id,
                    'travel_date' => $request->travel_date,
                    'passenger_name' => $request->passenger_name,
                    'passenger_id_number' => $request->passenger_id_number,
                    'passenger_dob' => $request->passenger_dob,
                    'passenger_gender' => $request->passenger_gender,
                    'seat_number' => $request->seat_number,
                    'payment_method' => $request->payment_method,
                    'status' => '',
                    'total_price' => $train->price,
                ]);
            });

            return response()->json($booking, 201);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Booking error: ' . $e->getMessage(), ['exception' => $e]);
            if ($e->getMessage() === 'No available seats for this train') {
                return response()->json(['message' => $e->getMessage()], 400);
            }
            return response()->json(['message' => 'Internal server error'], 500);
        }
    }
    
    public function history(Request $request)
    {
        try {
            $request->validate([
                'user_uuid' => 'required|uuid',
            ]);

            $user = \App\Models\User::where('uuid', $request->user_uuid)->first();

            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            $bookings = Booking::with(['train.departureStation', 'train.arrivalStation'])
                ->where('user_uuid', $user->uuid)
                ->orderBy('created_at', 'desc')
                ->get();
                                                 
                return response()->json($bookings);
            } catch (ValidationException $e) {
                return response()->json(['errors' => $e->errors()], 422);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Internal server error'], 500);
            }
    }

    public function updateStatus(Request $request, $transactionId)
    {
        try {
            $request->validate([
                'status' => 'required|string|in:pending,confirmed,cancelled,paid', // Define allowed statuses
            ]);

            $booking = Booking::where('transaction_id', $transactionId)->first();

            if (!$booking) {
                return response()->json(['message' => 'Booking not found'], 404);
            }

            // Optional: Check if the authenticated user owns this booking
            // if ($booking->user_uuid !== auth()->user()->uuid) { // Assuming user UUID is on auth()->user()
            //     return response()->json(['message' => 'Unauthorized'], 403);
            // }

            $booking->status = $request->status;
            $booking->save();

            return response()->json($booking, 200);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Update booking status error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Internal server error during status update'], 500);
        }
    }
}
