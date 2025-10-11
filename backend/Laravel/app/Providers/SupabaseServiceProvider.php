<?php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Supabase\Storage\StorageClient;
use Supabase\Postgrest\PostgrestClient;
use Supabase\GoTrue\GoTrueClient;

class SupabaseServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton('supabase.postgrest', function ($app) {
            return new PostgrestClient(
                config('services.supabase.url'),
                config('services.supabase.key'),
                ['schema' => 'public']
            );
        });
        
        $this->app->singleton('supabase.storage', function ($app) {
            return new StorageClient(
                config('services.supabase.key'),
                config('services.supabase.url')
            );
        });
        
        $this->app->singleton('supabase.auth', function ($app) {
            return new GoTrueClient(
                config('services.supabase.url'),
                config('services.supabase.key'),
                ['autoRefreshToken' => true]
            );
        });
    }
    
    public function boot()
    {
        //
    }
}