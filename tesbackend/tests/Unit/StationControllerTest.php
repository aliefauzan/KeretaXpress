<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Station;
use Illuminate\Foundation\Testing\RefreshDatabase;

class StationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        // Seed the stations table
        $this->seed(\Database\Seeders\StationSeeder::class);
    }

    public function testIndexReturnsStations()
    {
        $response = $this->actingAsUser()->getJson('/api/stations');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => ['id', 'name', 'city', 'created_at', 'updated_at'],
        ]);

        $stations = Station::all();
        $responseStations = collect($response->json());

        $this->assertEquals($stations->count(), $responseStations->count());
        $this->assertEquals($stations->first()->name, $responseStations->first()['name']);
    }

    protected function actingAsUser()
    {
        // Create or get a user and authenticate for the test
        $user = \App\Models\User::factory()->create();
        return $this->actingAs($user, 'sanctum');
    }
}
