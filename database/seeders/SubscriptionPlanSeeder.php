<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'freemium',
                'display_name' => 'Freemium',
                'description' => 'Free access to limited content with basic features',
                'price' => 0.00,
                'duration_days' => 365, // Freemium doesn't expire
                'features' => [
                    'Access to limited content',
                    'Basic video quality',
                    'Watch on 1 device',
                    'Community support',
                ],
                'max_devices' => 1,
                'video_quality' => 'SD',
                'downloadable_content' => false,
                'certificates' => false,
                'priority_support' => false,
                'ad_free' => false,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'basic',
                'display_name' => 'Basic',
                'description' => 'Perfect for learners who want more content and better quality',
                'price' => 9.99,
                'duration_days' => 30,
                'features' => [
                    'Access to intermediate level content',
                    'HD streaming quality',
                    'Watch on 2 devices',
                    'Email support',
                    'Progress tracking',
                ],
                'max_devices' => 2,
                'video_quality' => 'HD',
                'downloadable_content' => false,
                'certificates' => false,
                'priority_support' => false,
                'ad_free' => true,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'premium',
                'display_name' => 'Premium',
                'description' => 'Ultimate learning experience with all features unlocked',
                'price' => 19.99,
                'duration_days' => 30,
                'features' => [
                    'Access to all content',
                    '4K streaming quality',
                    'Watch on 3 devices',
                    'Priority support',
                    'Downloadable content',
                    'Certificates of completion',
                    'Ad-free experience',
                ],
                'max_devices' => 3,
                'video_quality' => '4K',
                'downloadable_content' => true,
                'certificates' => true,
                'priority_support' => true,
                'ad_free' => true,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'admin',
                'display_name' => 'Admin',
                'description' => 'Administrative access with full platform control',
                'price' => 0.00,
                'duration_days' => 365, // Admin doesn't expire
                'features' => [
                    'Full platform access',
                    'Content management',
                    'User management',
                    'Analytics dashboard',
                    'All premium features',
                ],
                'max_devices' => 999,
                'video_quality' => '4K',
                'downloadable_content' => true,
                'certificates' => true,
                'priority_support' => true,
                'ad_free' => true,
                'is_active' => true,
                'sort_order' => 0,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}
