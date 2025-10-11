<?php

namespace App\Http\Middleware;

use App\Providers\RouteServiceProvider;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class Authenticate
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        if ($request->bearerToken()) {
            // Check Laravel Sanctum token first
            if (Auth('sanctum')->check()) {
                return $next($request);
            }

            // Fallback to check Supabase token
            $supabase = app('supabase.auth');
            try {
                $user = $supabase->getUser($request->bearerToken());
                if ($user) {
                    $localUser = \App\Models\User::where('supabase_uid', $user->id)->first();
                    if ($localUser) {
                        Auth::login($localUser);
                        return $next($request);
                    }
                }
            } catch (\Exception $e) {
                // Continue to return unauthorized
            }
        }

        return response()->json(['message' => 'Unauthorized'], 401);
    }
}