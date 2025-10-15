<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user if not exists
        User::firstOrCreate(
            ['email' => 'admin@ana.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'subscription_type' => 'admin',
            ]
        );

        // Create test users if not exist
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password'),
                'subscription_type' => 'freemium',
            ]
        );

        User::firstOrCreate(
            ['email' => 'basic@example.com'],
            [
                'name' => 'Basic User',
                'password' => bcrypt('password'),
                'subscription_type' => 'basic',
            ]
        );

        User::firstOrCreate(
            ['email' => 'premium@example.com'],
            [
                'name' => 'Premium User',
                'password' => bcrypt('password'),
                'subscription_type' => 'premium',
            ]
        );

        // Seed categories, series, and videos
        $this->call([
            CategorySeeder::class,
            SeriesSeeder::class,
            VideoSeeder::class,
        ]);
    }
}
