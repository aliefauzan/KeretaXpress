<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('trains', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('operator');
            $table->foreignId('departure_station_id')->constrained('stations');
            $table->foreignId('arrival_station_id')->constrained('stations');
            $table->timestamp('departure_time');
            $table->timestamp('arrival_time');
            $table->integer('duration_minutes');
            $table->string('class_type');
            $table->decimal('price', 10, 2);
            $table->integer('available_seats');
            $table->timestamps();
        });
    }
    
    public function down()
    {
        Schema::dropIfExists('trains');
    }
};