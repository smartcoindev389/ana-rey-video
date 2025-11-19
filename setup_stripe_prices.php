<?php

/**
 * Helper script to set Stripe Price IDs for subscription plans
 * 
 * Usage:
 * php setup_stripe_prices.php
 * 
 * Or update manually via database:
 * UPDATE subscription_plans SET stripe_price_id = 'price_xxxxx' WHERE name = 'basic';
 * UPDATE subscription_plans SET stripe_price_id = 'price_xxxxx' WHERE name = 'premium';
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Stripe Price ID Setup ===\n\n";
echo "This script helps you set Stripe Price IDs for your subscription plans.\n\n";

$plans = \App\Models\SubscriptionPlan::where('price', '>', 0)->get();

if ($plans->isEmpty()) {
    echo "No paid plans found.\n";
    exit;
}

echo "Paid plans that need Stripe Price IDs:\n\n";

foreach ($plans as $plan) {
    echo sprintf("Plan: %s (ID: %d)\n", $plan->display_name, $plan->id);
    echo sprintf("  Name: %s\n", $plan->name);
    echo sprintf("  Price: $%.2f/month\n", $plan->price);
    
    if ($plan->stripe_price_id) {
        echo sprintf("  ✅ Current Stripe Price ID: %s\n", $plan->stripe_price_id);
    } else {
        echo "  ❌ Stripe Price ID: NOT SET\n";
    }
    
    echo "\n";
}

echo "=== Instructions ===\n\n";
echo "1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/products\n";
echo "2. Create a Product for each plan (e.g., 'Basic Plan', 'Premium Plan')\n";
echo "3. For each product, create a recurring monthly Price\n";
echo "4. Copy the Price ID (starts with 'price_')\n";
echo "5. Update the database using one of these methods:\n\n";

echo "Method 1: Using this script interactively\n";
echo "  Run: php setup_stripe_prices.php --interactive\n\n";

echo "Method 2: Using SQL directly\n";
foreach ($plans as $plan) {
    if (!$plan->stripe_price_id) {
        echo sprintf("  UPDATE subscription_plans SET stripe_price_id = 'price_xxxxx' WHERE name = '%s';\n", $plan->name);
    }
}

echo "\nMethod 3: Using Laravel Tinker\n";
foreach ($plans as $plan) {
    if (!$plan->stripe_price_id) {
        echo sprintf("  \$plan = App\\Models\\SubscriptionPlan::where('name', '%s')->first();\n", $plan->name);
        echo sprintf("  \$plan->update(['stripe_price_id' => 'price_xxxxx']);\n\n");
    }
}

echo "\n=== Test Mode vs Live Mode ===\n";
echo "Make sure you're using:\n";
echo "- Test mode Price IDs (price_xxxxx) if STRIPE_SECRET starts with 'sk_test_'\n";
echo "- Live mode Price IDs (price_xxxxx) if STRIPE_SECRET starts with 'sk_live_'\n\n";

