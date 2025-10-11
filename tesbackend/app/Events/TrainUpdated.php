<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TrainUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $train;
    
    public function __construct($train)
    {
        $this->train = $train;
    }
    
    public function broadcastOn()
    {
        return new Channel('train-updates');
    }
    
    public function broadcastWith()
    {
        return [
            'id' => $this->train['id'],
            'available_seats' => $this->train['available_seats']
        ];
    }
}