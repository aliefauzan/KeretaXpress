<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrainSearchTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test train search endpoint requires authentication.
     */
    public function test_train_search_requires_authentication()
    {
        $response = $this->getJson('/api/trains/search');
        $response->assertStatus(401);
    }
}
