<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration allows your React frontend to make authenticated
    | requests (including Range requests for video streaming) to your
    | Laravel backend during local development.
    |
    | DO NOT use '*' when supports_credentials = true — browsers will block it.
    |
    */

    // All API routes and Sanctum cookie route
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'storage/*'
    ],

    // Allow all HTTP verbs (GET, POST, PUT, DELETE, OPTIONS, etc.)
    'allowed_methods' => ['*'],

    // ✅ List your exact frontend origins (no wildcard!)
    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],

    // Optional regex patterns for origins
    'allowed_origins_patterns' => [],

    // Allow all headers so Range and Authorization are included
    'allowed_headers' => ['*'],

    // Expose headers needed for video playback
    'exposed_headers' => [
        'Content-Length',
        'Content-Range',
        'Accept-Ranges',
    ],

    // Cache preflight response for 1 hour
    'max_age' => 3600,

    // ✅ Required when using Sanctum / use-credentials
    'supports_credentials' => true,
];
