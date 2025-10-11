<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Train;
use App\Models\Station;

class TrainSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stations = Station::all()->keyBy('name');

        $trains = [
            [
                'name' => 'Argo Bromo',
                'operator' => 'PT KAI',
                'departure_station_id' => $stations->get('Surabaya')->id ?? null,
                'arrival_station_id' => $stations->get('Jakarta')->id ?? null,
                'departure_time' => '08:00:00',
                'arrival_time' => '18:00:00',
                'duration_minutes' => 600,
                'class_type' => 'Eksekutif',
                'price' => 150000,
                'available_seats' => 100,
            ],
            [
                'name' => 'Lodaya',
                'operator' => 'PT KAI',
                'departure_station_id' => $stations->get('Bandung')->id ?? null,
                'arrival_station_id' => $stations->get('Yogyakarta')->id ?? null,
                'departure_time' => '09:00:00',
                'arrival_time' => '15:00:00',
                'duration_minutes' => 360,
                'class_type' => 'Bisnis',
                'price' => 120000,
                'available_seats' => 80,
            ],
            [
                'name' => 'Taksaka',
                'operator' => 'PT KAI',
                'departure_station_id' => $stations->get('Jakarta')->id ?? null,
                'arrival_station_id' => $stations->get('Yogyakarta')->id ?? null,
                'departure_time' => '07:00:00',
                'arrival_time' => '14:00:00',
                'duration_minutes' => 420,
                'class_type' => 'Eksekutif',
                'price' => 130000,
                'available_seats' => 90,
            ],
            [
                'name' => 'Gajayana',
                'operator' => 'PT KAI',
                'departure_station_id' => $stations->get('Malang')->id ?? null,
                'arrival_station_id' => $stations->get('Jakarta')->id ?? null,
                'departure_time' => '10:00:00',
                'arrival_time' => '20:00:00',
                'duration_minutes' => 600,
                'class_type' => 'Eksekutif',
                'price' => 140000,
                'available_seats' => 100,
            ],
            [
                'name' => 'Mutiara Selatan',
                'operator' => 'PT KAI',
                'departure_station_id' => $stations->get('Bandung')->id ?? null,
                'arrival_station_id' => $stations->get('Surabaya')->id ?? null,
                'departure_time' => '06:00:00',
                'arrival_time' => '16:00:00',
                'duration_minutes' => 600,
                'class_type' => 'Bisnis',
                'price' => 135000,
                'available_seats' => 85,
            ],
        ];

        foreach ($trains as $train) {
            if ($train['departure_station_id'] && $train['arrival_station_id']) {
                Train::create($train);
            }
        }
    }
}
