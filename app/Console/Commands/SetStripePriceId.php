<?php

namespace App\Console\Commands;

use App\Models\SubscriptionPlan;
use Illuminate\Console\Command;

class SetStripePriceId extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stripe:set-price-id 
                            {plan : The plan name (basic, premium)}
                            {price_id : The Stripe Price ID (starts with price_)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set Stripe Price ID for a subscription plan';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $planName = $this->argument('plan');
        $priceId = $this->argument('price_id');

        // Validate price ID format
        if (!str_starts_with($priceId, 'price_')) {
            $this->error('Invalid Stripe Price ID. It must start with "price_"');
            return 1;
        }

        // Find the plan
        $plan = SubscriptionPlan::where('name', $planName)->first();

        if (!$plan) {
            $this->error("Plan '{$planName}' not found.");
            $this->info('Available plans: ' . SubscriptionPlan::pluck('name')->join(', '));
            return 1;
        }

        // Update the plan
        $plan->update(['stripe_price_id' => $priceId]);

        $this->info("✅ Successfully set Stripe Price ID for '{$plan->display_name}' plan:");
        $this->line("   Plan: {$plan->name} (ID: {$plan->id})");
        $this->line("   Price: \${$plan->price}/month");
        $this->line("   Stripe Price ID: {$priceId}");

        return 0;
    }
}

