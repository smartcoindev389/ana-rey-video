<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@sacrart.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'subscription_type' => 'admin',
            'email_verified_at' => now(),
        ]);

        $this->command->info('Admin user created:');
        $this->command->info('Email: admin@sacrart.com');
        $this->command->info('Password: password');
    }
}