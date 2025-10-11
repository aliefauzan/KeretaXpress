<?php

namespace Tests\Unit;

use App\Models\Train;
use App\Models\Station;
use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrainTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_train()
    {
        $departureStation = Station::factory()->create();
        $arrivalStation = Station::factory()->create();

        $trainData = [
            'name' => 'Test Train',
            'operator' => 'Test Operator',
            'departure_station_id' => $departureStation->id,
            'arrival_station_id' => $arrivalStation->id,
            'departure_time' => now(),
            'arrival_time' => now()->addHours(2),
            'duration_minutes' => 120,
            'class_type' => 'Economy',
            'price' => 100.50,
            'available_seats' => 50,
        ];

        $train = Train::create($trainData);

        $this->assertInstanceOf(Train::class, $train);
        $this->assertEquals('Test Train', $train->name);
        $this->assertEquals('Test Operator', $train->operator);
        $this->assertEquals($departureStation->id, $train->departure_station_id);
        $this->assertEquals($arrivalStation->id, $train->arrival_station_id);
        $this->assertEquals('Economy', $train->class_type);
        $this->assertEquals(100.50, $train->price);
        $this->assertEquals(50, $train->available_seats);
    }

    public function test_departure_station_relationship()
    {
        $train = new Train();
        $relation = $train->departureStation();
        $this->assertEquals('departure_station_id', $relation->getForeignKeyName());
        $this->assertEquals(Station::class, $relation->getRelated()::class);
    }

    public function test_arrival_station_relationship()
    {
        $train = new Train();
        $relation = $train->arrivalStation();
        $this->assertEquals('arrival_station_id', $relation->getForeignKeyName());
        $this->assertEquals(Station::class, $relation->getRelated()::class);
    }

    public function test_bookings_relationship()
    {
        $train = new Train();
        $relation = $train->bookings();
        $this->assertEquals(Booking::class, $relation->getRelated()::class);
    }
}
