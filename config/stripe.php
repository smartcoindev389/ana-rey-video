<?php

return [
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    'currency' => env('STRIPE_CURRENCY', 'usd'),
    // Frontend should provide success/cancel URLs; these are fallbacks
    'success_url' => env('STRIPE_SUCCESS_URL', env('APP_URL') . '/payment/success'),
    'cancel_url' => env('STRIPE_CANCEL_URL', env('APP_URL') . '/payment/cancel'),
    // Price IDs from environment (fallback if not in database)
    'price_ids' => [
        'basic' => env('STRIPE_PRICE_ID_BASIC'),
        'premium' => env('STRIPE_PRICE_ID_PREMIUM'),
        'freemium' => env('STRIPE_PRICE_ID_FREEMIUM'),
        'admin' => env('STRIPE_PRICE_ID_ADMIN'),
    ],
];


