<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Train extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'operator', 'departure_station_id', 'arrival_station_id',
        'departure_time', 'arrival_time', 'duration_minutes', 'class_type',
        'price', 'available_seats'
    ];
    
    protected $casts = [
        'departure_time' => 'datetime',
        'arrival_time' => 'datetime'
    ];
    
    public function departureStation()
    {
        return $this->belongsTo(Station::class, 'departure_station_id');
    }
    
    public function arrivalStation()
    {
        return $this->belongsTo(Station::class, 'arrival_station_id');
    }
    
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}