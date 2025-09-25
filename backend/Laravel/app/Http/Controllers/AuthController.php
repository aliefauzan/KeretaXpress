<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log; // Add Log facade
use Illuminate\Validation\ValidationException;
use Exception;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            // Validate input
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);
        
            // Create new user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);
        
            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;
        
            return response()->json([
                'user' => $user,
                'token' => $token,
            ], 201);
        } catch (ValidationException $ve) {
            // Return validation errors with 422 status
            return response()->json(['errors' => $ve->errors()], 422);
        } catch (Exception $e) {
            // Log the exception with detailed information
            Log::error('Register error: ' . $e->getMessage(), [
                'stack' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json(['message' => 'Internal server error'], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            // Validate input
            $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);
        
            if (!Auth::attempt($request->only('email', 'password'))) {
                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }
        
            $user = User::where('email', $request->email)->first();
            $token = $user->createToken('auth_token')->plainTextToken;
        
            // Add UUID to user object
            $user->uuid = $user->uuid ?? null;
        
            return response()->json([
                'user' => $user,
                'token' => $token,
            ]);
        } catch (Exception $e) {
            // Log the exception with detailed information
            Log::error('Login error: ' . $e->getMessage(), [
                'stack' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json(['message' => 'Internal server error'], 500);
        }
    }    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Successfully logged out']);
        } catch (Exception $e) {
            // Log any error during logout
            Log::error('Logout error: ' . $e->getMessage(), [
                'stack' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Internal server error'], 500);
        }
    }

    public function refresh(Request $request)
    {
        try {
            $user = $request->user();
            
            // Delete current token
            $request->user()->currentAccessToken()->delete();
            
            // Create new token with extended expiration
            $token = $user->createToken('auth_token')->plainTextToken;
            
            // Add UUID to user object
            $user->uuid = $user->uuid ?? null;
            
            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Token refreshed successfully'
            ]);
        } catch (Exception $e) {
            // Log the exception with detailed information
            Log::error('Token refresh error: ' . $e->getMessage(), [
                'stack' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Token refresh failed'], 401);
        }
    }

    public function user(Request $request, $uuid = null)
    {
        try {
            if ($uuid) {
                $user = User::where('uuid', $uuid)->first();
                if (!$user) {
                    return response()->json(['message' => 'User not found'], 404);
                }
                return response()->json(['user' => $user]);
            }
            return response()->json(['user' => $request->user()]);
        } catch (Exception $e) {
            // Log the exception with detailed information
            Log::error('User fetching error: ' . $e->getMessage(), [
                'stack' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json(['message' => 'Internal server error'], 500);
        }
    }
}
