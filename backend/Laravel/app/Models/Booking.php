<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id', 'user_uuid', 'train_id', 'travel_date',
        'passenger_name', 'passenger_id_number', 'passenger_dob',
        'passenger_gender', 'seat_number', 'status', 'total_price',
        'payment_proof', 'payment_method'
    ];
    
    protected $casts = [
        'travel_date' => 'date',
        'passenger_dob' => 'date'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class, 'user_uuid', 'uuid');
    }
    
    public function train()
    {
        return $this->belongsTo(Train::class);
    }
}