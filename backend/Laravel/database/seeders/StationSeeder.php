<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Station;

class StationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stations = [
            ['name' => 'Surabaya', 'city' => 'Surabaya'],
            ['name' => 'Jakarta', 'city' => 'Jakarta'],
            ['name' => 'Bandung', 'city' => 'Bandung'],
            ['name' => 'Yogyakarta', 'city' => 'Yogyakarta'],
            ['name' => 'Malang', 'city' => 'Malang'],
        ];

        foreach ($stations as $station) {
            Station::create($station);
        }
    }
}
