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
        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('series_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('video_id')->nullable()->constrained()->onDelete('cascade');
            
            // Progress tracking
            $table->integer('progress_percentage')->default(0); // 0-100
            $table->integer('time_watched')->default(0); // Time watched in seconds
            $table->integer('last_position')->default(0); // Last position in seconds
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            
            // Video-specific progress
            $table->integer('video_duration')->nullable(); // Total video duration
            $table->json('watch_history')->nullable(); // Array of watch sessions
            $table->integer('watch_count')->default(1); // Number of times watched
            
            // Series progress
            $table->integer('videos_completed')->default(0);
            $table->integer('total_videos')->nullable();
            $table->decimal('series_progress', 5, 2)->default(0.00); // Series completion percentage
            
            // Rating and feedback
            $table->integer('rating')->nullable(); // 1-5 stars
            $table->text('review')->nullable();
            $table->boolean('is_favorite')->default(false);
            $table->timestamp('favorited_at')->nullable();
            
            // Learning analytics
            $table->timestamp('last_watched_at')->nullable();
            $table->timestamp('first_watched_at')->nullable();
            $table->integer('total_watch_time')->default(0); // Cumulative watch time
            
            $table->timestamps();
            
            // Indexes
            $table->unique(['user_id', 'video_id']); // One progress record per user per video
            $table->index(['user_id', 'series_id']);
            $table->index(['user_id', 'is_completed']);
            $table->index(['user_id', 'last_watched_at']);
            $table->index(['series_id', 'is_completed']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_progress');
    }
};