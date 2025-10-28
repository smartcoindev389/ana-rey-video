<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Video;
use App\Models\UserProgress;
use App\Models\PaymentTransaction;
use App\Models\Subscription;
use Carbon\Carbon;

class AnalyticsTestDataSeeder extends Seeder
{
    /**
     * Seed test data for analytics and dashboard.
     */
    public function run(): void
    {
        $this->command->info('Seeding analytics test data...');

        // Create test users if they don't exist
        $users = User::whereIn('subscription_type', ['basic', 'premium'])->get();
        
        if ($users->count() < 5) {
            $this->command->info('Creating test users...');
            for ($i = 0; $i < 10; $i++) {
                // Check if user already exists
                $existingUser = User::where('email', 'testuser' . ($i + 1) . '@example.com')->first();
                if ($existingUser) {
                    $users->push($existingUser);
                    continue;
                }
                
                $subscriptionType = ['freemium', 'basic', 'premium'][array_rand(['freemium', 'basic', 'premium'])];
                $user = User::create([
                    'name' => 'Test User ' . ($i + 1),
                    'email' => 'testuser' . ($i + 1) . '@example.com',
                    'password' => bcrypt('password'),
                    'subscription_type' => $subscriptionType,
                    'subscription_expires_at' => $subscriptionType !== 'freemium' ? now()->addMonths(1) : null,
                    'subscription_started_at' => $subscriptionType !== 'freemium' ? now()->subMonths(rand(1, 6)) : null,
                    'created_at' => now()->subDays(rand(1, 90)),
                ]);
                $users->push($user);
            }
        } else {
            // Get all users for progress seeding
            $users = User::all();
        }

        // Get all videos
        $videos = Video::all();
        
        if ($videos->count() === 0) {
            $this->command->warn('No videos found. Please seed videos first.');
            return;
        }

        $this->command->info('Creating user progress data...');
        
        // Create user progress for videos
        foreach ($videos as $video) {
            // Random number of users have watched this video
            $watcherCount = rand(5, min(20, $users->count()));
            $watchers = $users->random($watcherCount);
            
            foreach ($watchers as $user) {
                // Check if progress already exists
                $existingProgress = UserProgress::where('user_id', $user->id)
                    ->where('video_id', $video->id)
                    ->first();
                
                if (!$existingProgress) {
                    $progressPercentage = rand(0, 100);
                    $isCompleted = $progressPercentage >= 90;
                    
                    UserProgress::create([
                        'user_id' => $user->id,
                        'video_id' => $video->id,
                        'category_id' => $video->category_id,
                        'progress_percentage' => $progressPercentage,
                        'video_duration' => $video->duration,
                        'time_watched' => (int)($video->duration * $progressPercentage / 100),
                        'last_position' => (int)($video->duration * $progressPercentage / 100),
                        'is_completed' => $isCompleted,
                        'completed_at' => $isCompleted ? now()->subDays(rand(0, 30)) : null,
                        'is_favorite' => rand(0, 1) ? true : false,
                        'favorited_at' => rand(0, 1) ? now()->subDays(rand(0, 30)) : null,
                        'rating' => rand(1, 5),
                        'watch_count' => rand(1, 5),
                        'total_watch_time' => (int)($video->duration * rand(1, 3)),
                        'last_watched_at' => now()->subDays(rand(0, 30)),
                        'first_watched_at' => now()->subDays(rand(30, 90)),
                    ]);
                }
            }
            
            // Update video views
            $video->update([
                'views' => rand(50, 500),
                'unique_views' => rand(20, 300),
            ]);
        }

        $this->command->info('Creating payment transactions...');
        
        // Create payment transactions for the past 12 months
        $paidUsers = $users->where('subscription_type', '!=', 'freemium');
        
        foreach ($paidUsers as $user) {
            // Create 1-3 transactions over the past months
            $transactionCount = rand(1, 3);
            
            for ($i = 0; $i < $transactionCount; $i++) {
                $amount = $user->subscription_type === 'basic' ? 9.99 : 19.99;
                $createdAt = now()->subMonths(rand(0, 11));
                
                // Check if transaction already exists
                $existingTransaction = PaymentTransaction::where('user_id', $user->id)
                    ->where('created_at', '>=', $createdAt->copy()->startOfMonth())
                    ->where('created_at', '<=', $createdAt->copy()->endOfMonth())
                    ->first();
                
                if (!$existingTransaction) {
                    PaymentTransaction::create([
                        'user_id' => $user->id,
                        'transaction_id' => 'TXN-' . strtoupper(uniqid()),
                        'amount' => $amount,
                        'currency' => 'USD',
                        'status' => 'completed',
                        'type' => 'subscription',
                        'payment_method' => ['stripe', 'paypal', 'credit_card'][rand(0, 2)],
                        'payment_gateway' => 'stripe',
                        'notes' => ucfirst($user->subscription_type) . ' subscription',
                        'paid_at' => $createdAt,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                }
            }
        }

        $this->command->info('Creating subscriptions...');
        
        // Check if subscription plans exist first
        $subscriptionPlans = \App\Models\SubscriptionPlan::whereIn('name', ['Basic', 'Premium'])->get();
        
        if ($subscriptionPlans->count() >= 2) {
            $basicPlan = $subscriptionPlans->firstWhere('name', 'Basic');
            $premiumPlan = $subscriptionPlans->firstWhere('name', 'Premium');
            
            // Create subscriptions
            foreach ($paidUsers as $user) {
                // Check if subscription already exists
                $existingSubscription = Subscription::where('user_id', $user->id)->first();
                
                if (!$existingSubscription) {
                    $plan = $user->subscription_type === 'basic' ? $basicPlan : $premiumPlan;
                    if ($plan) {
                        Subscription::create([
                            'user_id' => $user->id,
                            'subscription_plan_id' => $plan->id,
                            'status' => 'active',
                            'started_at' => now()->subMonths(rand(1, 6)),
                            'expires_at' => now()->addMonths(1),
                            'amount' => $plan->price,
                            'billing_cycle' => 'monthly',
                            'auto_renew' => true,
                        ]);
                    }
                }
            }
        } else {
            $this->command->warn('Skipping subscription creation - subscription plans not found. Please run SubscriptionPlanSeeder first.');
        }

        $this->command->info('Analytics test data seeded successfully!');
    }
}

