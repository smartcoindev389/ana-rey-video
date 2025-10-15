<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add instructor fields
            $table->string('bio')->nullable()->after('role');
            $table->string('avatar')->nullable()->after('bio');
            $table->string('website')->nullable()->after('avatar');
            $table->string('social_links')->nullable()->after('website'); // JSON field for social media links
            
            // Add last login tracking
            $table->timestamp('last_login_at')->nullable()->after('subscription_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bio', 'avatar', 'website', 'social_links', 'last_login_at']);
        });
    }
};