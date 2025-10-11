<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\Train;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_booking_history()
    {
        $user = User::factory()->create();
        $train = Train::factory()->create();

        // Create multiple bookings for the user
        $bookings = Booking::factory()->count(3)->create([
            'user_uuid' => $user->uuid,
            'train_id' => $train->id,
        ]);

        $this->actingAs($user);

        $response = $this->getJson('/api/bookings/history?user_uuid=' . $user->uuid);

        $response->assertStatus(200);

        // Assert the response JSON contains 3 bookings
        $responseData = $response->json();
        $this->assertCount(3, $responseData);

        // Assert the bookings belong to the user and train
        foreach ($responseData as $booking) {
            $this->assertEquals($user->uuid, $booking['user_uuid']);
            $this->assertEquals($train->id, $booking['train_id']);
        }
    }

    public function test_booking_history_invalid_user_uuid()
    {
        $this->actingAs(User::factory()->create());

        $response = $this->getJson('/api/bookings/history?user_uuid=invalid-uuid');

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['user_uuid']);
    }

    public function test_booking_history_non_existent_user()
    {
        $this->actingAs(User::factory()->create());

        $response = $this->getJson('/api/bookings/history?user_uuid=00000000-0000-0000-0000-000000000000');

        $response->assertStatus(404);
        $response->assertJson([
            'message' => 'User not found',
        ]);
    }

    public function test_booking_history_user_with_no_bookings()
    {
        $user = User::factory()->create();

        $this->actingAs($user);

        $response = $this->getJson('/api/bookings/history?user_uuid=' . $user->uuid);

        $response->assertStatus(200);
        $response->assertExactJson([]);
    }
}
