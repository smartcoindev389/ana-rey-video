<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum to include 'admin'
        DB::statement("ALTER TABLE users MODIFY COLUMN subscription_type ENUM('freemium', 'basic', 'premium', 'admin') NOT NULL DEFAULT 'freemium'");
        
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->after('subscription_expires_at'); // user or admin
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
        
        // Revert the enum back
        DB::statement("ALTER TABLE users MODIFY COLUMN subscription_type ENUM('freemium', 'basic', 'premium') NOT NULL DEFAULT 'freemium'");
    }
};
