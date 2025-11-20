<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Stripe Integration Check ===\n\n";

// Check .env configuration
echo "1. Checking .env configuration:\n";
$stripeSecret = env('STRIPE_SECRET');
$webhookSecret = env('STRIPE_WEBHOOK_SECRET');

if ($stripeSecret) {
    echo "   ✅ STRIPE_SECRET is set (starts with: " . substr($stripeSecret, 0, 7) . "...)\n";
} else {
    echo "   ❌ STRIPE_SECRET is NOT set in .env\n";
}

if ($webhookSecret) {
    echo "   ✅ STRIPE_WEBHOOK_SECRET is set (starts with: " . substr($webhookSecret, 0, 7) . "...)\n";
} else {
    echo "   ⚠️  STRIPE_WEBHOOK_SECRET is NOT set (needed for webhooks)\n";
}

echo "\n2. Checking Environment Variables for Price IDs:\n";
$envPriceIds = [
    'STRIPE_PRICE_ID_BASIC' => env('STRIPE_PRICE_ID_BASIC'),
    'STRIPE_PRICE_ID_PREMIUM' => env('STRIPE_PRICE_ID_PREMIUM'),
    'STRIPE_PRICE_ID_FREEMIUM' => env('STRIPE_PRICE_ID_FREEMIUM'),
];

foreach ($envPriceIds as $key => $value) {
    if ($value) {
        echo "   ✅ {$key}: {$value}\n";
    } else {
        echo "   ⚠️  {$key}: NOT SET\n";
    }
}

echo "\n3. Checking Subscription Plans:\n";
$plans = \App\Models\SubscriptionPlan::all();

foreach ($plans as $plan) {
    $priceId = $plan->stripe_price_id; // This will use the accessor
    $status = $priceId ? '✅' : '❌';
    echo sprintf(
        "   %s Plan: %s (ID: %d, Name: %s, Price: $%.2f)\n",
        $status,
        $plan->display_name,
        $plan->id,
        $plan->name,
        $plan->price
    );
    if ($priceId) {
        $source = $plan->getAttributes()['stripe_price_id'] ?? null;
        $sourceText = $source ? 'database' : 'env/config';
        echo "      Stripe Price ID: {$priceId} (from {$sourceText})\n";
    } else {
        echo "      ⚠️  Stripe Price ID: NOT SET (neither in DB nor env)\n";
    }
}

echo "\n4. Summary:\n";
$plansWithStripe = $plans->filter(fn($p) => $p->stripe_price_id && $p->price > 0)->count();
$totalPaidPlans = $plans->filter(fn($p) => $p->price > 0)->count();

echo "   Paid plans with Stripe configured: {$plansWithStripe} / {$totalPaidPlans}\n";

if ($plansWithStripe < $totalPaidPlans) {
    echo "\n⚠️  ACTION REQUIRED:\n";
    echo "   Some paid plans don't have Stripe Price IDs configured.\n";
    echo "   Steps to fix:\n";
    echo "   1. Go to Stripe Dashboard → Products\n";
    echo "   2. Create Products for Basic and Premium plans\n";
    echo "   3. Create recurring monthly Prices for each product\n";
    echo "   4. Copy the Price IDs (start with 'price_')\n";
    echo "   5. Update database:\n";
    echo "      UPDATE subscription_plans SET stripe_price_id = 'price_xxxxx' WHERE name = 'basic';\n";
    echo "      UPDATE subscription_plans SET stripe_price_id = 'price_xxxxx' WHERE name = 'premium';\n";
} else {
    echo "\n✅ All paid plans are configured for Stripe!\n";
}

