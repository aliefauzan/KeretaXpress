<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique();
            $table->uuid('user_uuid')->constrained('users', 'uuid');
            $table->foreignId('train_id')->constrained();
            $table->date('travel_date');
            $table->string('passenger_name');
            $table->string('passenger_id_number');
            $table->date('passenger_dob');
            $table->string('passenger_gender');
            $table->string('status')->default('pending');
            $table->decimal('total_price', 10, 2);
            $table->string('payment_proof')->nullable();
            $table->timestamps();
        });
    }
    
    public function down()
    {
        Schema::dropIfExists('bookings');
    }
};