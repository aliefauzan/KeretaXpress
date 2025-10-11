<?php

namespace Database\Factories;

use App\Models\Station;
use Illuminate\Database\Eloquent\Factories\Factory;

class StationFactory extends Factory
{
    protected $model = Station::class;

    public function definition()
    {
        return [
            'name' => $this->faker->city . ' Station',
            'city' => $this->faker->city,
            'address' => $this->faker->address,
            'code' => strtoupper($this->faker->lexify('???')),
        ];
    }
}
