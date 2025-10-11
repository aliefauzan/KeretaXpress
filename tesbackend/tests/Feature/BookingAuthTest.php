<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingAuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test booking creation requires authentication.
     */
    public function test_booking_creation_requires_authentication()
    {
        $response = $this->postJson('/api/bookings', []);
        $response->assertStatus(401);
    }
}
