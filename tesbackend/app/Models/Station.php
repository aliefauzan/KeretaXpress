<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Station extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'city', 'address'];
    
    public function departureTrains()
    {
        return $this->hasMany(Train::class, 'departure_station_id');
    }
    
    public function arrivalTrains()
    {
        return $this->hasMany(Train::class, 'arrival_station_id');
    }
}