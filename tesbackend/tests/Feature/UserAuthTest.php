<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user registration.
     */
    public function test_user_can_register()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User Terbaru',
            'email' => 'testuserterbaru@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'user' => ['id', 'name', 'email'],
                     'token'
                 ]);
    }

    /**
     * Test user login.
     */
    public function test_user_can_login()
    {
        // First register user
        $this->test_user_can_register();

        $response = $this->postJson('/api/login', [
            'email' => 'testuserterbaru@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'user' => ['id', 'name', 'email'],
                     'token'
                 ]);
    }

    /**
     * Test authenticated user can get user info.
     */
    public function test_authenticated_user_can_get_user_info()
    {
        $this->test_user_can_register();

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'testuserterbaru@example.com',
            'password' => 'password',
        ]);

        $token = $loginResponse->json('token');

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/user');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'user' => ['id', 'name', 'email']
                 ]);
    }
}
