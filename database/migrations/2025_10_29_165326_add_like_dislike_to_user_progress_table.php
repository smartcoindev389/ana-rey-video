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
        Schema::table('user_progress', function (Blueprint $table) {
            $table->boolean('is_liked')->default(false)->after('is_favorite');
            $table->boolean('is_disliked')->default(false)->after('is_liked');
            $table->timestamp('liked_at')->nullable()->after('is_disliked');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropColumn(['is_liked', 'is_disliked', 'liked_at']);
        });
    }
};
