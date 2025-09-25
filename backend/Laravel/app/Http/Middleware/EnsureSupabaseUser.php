<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSupabaseUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supabase = app('supabase.auth');
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Authorization token required'], 401);
        }

        try {
            $user = $supabase->getUser($token);
            if (!$user) {
                return response()->json(['message' => 'Invalid Supabase token'], 401);
            }

            // Store the authenticated user in the request
            $request->supabase_user = $user;
            
            return $next($request);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Supabase authentication failed'], 401);
        }
    }
}