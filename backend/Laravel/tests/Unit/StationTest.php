<?php

namespace Tests\Unit;

use App\Models\Station;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_station()
    {
        $station = Station::factory()->create([
            'name' => 'Test Station',
            'city' => 'Test City',
            'code' => 'TS01',
        ]);

        $this->assertInstanceOf(Station::class, $station);
        $this->assertEquals('Test Station', $station->name);
        $this->assertEquals('Test City', $station->city);
        $this->assertEquals('TS01', $station->code);
    }
}
