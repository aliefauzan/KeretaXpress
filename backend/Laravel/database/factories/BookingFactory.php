<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Train;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition()
    {
        return [
            'transaction_id' => $this->faker->unique()->uuid,
            'user_uuid' => User::factory(),
            'train_id' => Train::factory(),
            'seat_number' => $this->faker->bothify('??#'),
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'cancelled']),
            'total_price' => $this->faker->randomFloat(2, 10, 500),
            'payment_proof' => null,
            'passenger_name' => $this->faker->name,
            'passenger_id_number' => $this->faker->numerify('##########'),
            'passenger_dob' => $this->faker->date(),
            'passenger_gender' => $this->faker->randomElement(['male', 'female']),
            'travel_date' => $this->faker->date(),
        ];
    }
}
