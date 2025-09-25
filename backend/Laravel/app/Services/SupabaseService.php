<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SupabaseService
{
    protected $baseUrl;
    protected $apiKey;
    protected $bucket;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.supabase.url'), '/');
        $this->apiKey = config('services.supabase.key');
        $this->bucket = config('services.supabase.bucket');
    }

    protected function headers()
    {
        return [
            'apikey' => $this->apiKey,
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ];
    }

    public function getAll($table)
    {
        $url = "{$this->baseUrl}/rest/v1/{$table}";
        return Http::withHeaders($this->headers())->get($url)->json();
    }

    public function insert($table, array $data)
    {
        $url = "{$this->baseUrl}/rest/v1/{$table}";
        return Http::withHeaders($this->headers())->post($url, $data)->json();
    }

    public function uploadFile($path, $file)
    {
        $url = "{$this->baseUrl}/storage/v1/object/{$this->bucket}/{$path}";
        return Http::withHeaders([
            'apikey' => $this->apiKey,
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/octet-stream',
        ])->put($url, fopen($file, 'r'))->json();
    }

    public function getPublicUrl($path)
    {
        return "{$this->baseUrl}/storage/v1/object/public/{$this->bucket}/{$path}";
    }

    public function rpc($function, array $params = [])
    {
        $url = "{$this->baseUrl}/rest/v1/rpc/{$function}";
        return \Illuminate\Support\Facades\Http::withHeaders($this->headers())->post($url, $params);
    }
}
