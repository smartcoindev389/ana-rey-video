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
        Schema::table('video_comments', function (Blueprint $table) {
            // Change comment_time from timestamp to integer seconds (nullable)
            $table->integer('comment_time')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('video_comments', function (Blueprint $table) {
            // Revert back to timestamp if needed
            $table->timestamp('comment_time')->nullable()->change();
        });
    }
};
