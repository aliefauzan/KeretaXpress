<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Custom Supabase guard
        Auth::viaRequest('supabase', function (Request $request) {
            $supabase = app('supabase.auth');
            $token = $request->bearerToken();

            if (!$token) {
                return null;
            }

            try {
                $supabaseUser = $supabase->getUser($token);
                if (!$supabaseUser) {
                    return null;
                }

                return User::where('supabase_uid', $supabaseUser->id)->first();
            } catch (\Exception $e) {
                return null;
            }
        });
    }
}