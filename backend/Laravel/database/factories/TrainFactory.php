<?php

namespace Database\Factories;

use App\Models\Train;
use App\Models\Station;
use Illuminate\Database\Eloquent\Factories\Factory;

class TrainFactory extends Factory
{
    protected $model = Train::class;

    public function definition()
    {
        return [
            'name' => $this->faker->word . ' Train',
            'operator' => $this->faker->company,
            'departure_station_id' => Station::factory(),
            'arrival_station_id' => Station::factory(),
            'departure_time' => $this->faker->dateTimeBetween('now', '+1 week'),
            'arrival_time' => $this->faker->dateTimeBetween('+1 week', '+2 weeks'),
            'duration_minutes' => $this->faker->numberBetween(30, 300),
            'class_type' => $this->faker->randomElement(['Economy', 'Business', 'First']),
            'price' => $this->faker->randomFloat(2, 10, 500),
            'available_seats' => $this->faker->numberBetween(10, 200),
        ];
    }
}
