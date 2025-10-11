<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\Train;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_booking()
    {
        $user = User::factory()->create();
        $train = Train::factory()->create();

        $booking = Booking::factory()->create([
            'user_uuid' => $user->uuid,
            'train_id' => $train->id,
            'seat_number' => 'A1',
            'status' => 'confirmed',
            'total_price' => 150.75,
        ]);

        $this->assertInstanceOf(Booking::class, $booking);
        $this->assertEquals($user->uuid, $booking->user_uuid);
        $this->assertEquals($train->id, $booking->train_id);
        $this->assertEquals('A1', $booking->seat_number);
        $this->assertEquals('confirmed', $booking->status);
        $this->assertEquals(150.75, $booking->total_price);
    }

    public function test_user_relationship()
    {
        $booking = new Booking();
        $relation = $booking->user();
        $this->assertEquals('user_uuid', $relation->getForeignKeyName());
        $this->assertEquals(User::class, $relation->getRelated()::class);
    }

    public function test_train_relationship()
    {
        $booking = new Booking();
        $relation = $booking->train();
        $this->assertEquals('train_id', $relation->getForeignKeyName());
        $this->assertEquals(Train::class, $relation->getRelated()::class);
    }

    public function test_booking_creation_validation_errors()
{
    $user = User::factory()->create();
    $train = Train::factory()->create(['available_seats' => 10]);

    $payload = [
        // Missing required fields intentionally
    ];

    $this->actingAs($user);
    $response = $this->postJson('/api/bookings', $payload);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors([
        'user_uuid',
        'train_id',
        'travel_date',
        'passenger_name',
        'passenger_id_number',
        'passenger_dob',
        'passenger_gender',
        'payment_method',
        'seat_number',
    ]);
}

public function test_booking_creation_no_available_seats()
{
    $user = User::factory()->create();
    $train = Train::factory()->create(['available_seats' => 0]);

    $payload = [
        'user_uuid' => $user->uuid,
        'train_id' => $train->id,
        'travel_date' => now()->toDateString(),
        'passenger_name' => 'Test User',
        'passenger_id_number' => '1234567890123456',
        'passenger_dob' => '2000-01-01',
        'passenger_gender' => 'male',
        'payment_method' => 'transfer',
        'seat_number' => 'A1',
    ];

    $this->actingAs($user);
    $response = $this->postJson('/api/bookings', $payload);

    $response->assertStatus(400);
    $response->assertJson([
        'message' => 'No available seats for this train',
    ]);
}


}
