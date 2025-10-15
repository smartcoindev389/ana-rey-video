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
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('short_description')->nullable();
            $table->foreignId('series_id')->constrained()->onDelete('cascade');
            $table->foreignId('instructor_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Video content
            $table->string('video_url')->nullable(); // Main video URL
            $table->string('video_file_path')->nullable(); // Local file path
            $table->string('thumbnail')->nullable();
            $table->integer('duration')->default(0); // Duration in seconds
            $table->integer('file_size')->nullable(); // File size in bytes
            $table->string('video_format')->nullable(); // mp4, webm, etc.
            $table->string('video_quality')->nullable(); // 720p, 1080p, etc.
            
            // Streaming URLs (for different qualities)
            $table->json('streaming_urls')->nullable(); // Multiple quality URLs
            $table->string('hls_url')->nullable(); // HLS streaming URL
            $table->string('dash_url')->nullable(); // DASH streaming URL
            
            // Access control
            $table->enum('visibility', ['freemium', 'basic', 'premium'])->default('freemium');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->boolean('is_free')->default(true);
            $table->decimal('price', 8, 2)->nullable();
            
            // Video organization
            $table->integer('episode_number')->nullable();
            $table->integer('sort_order')->default(0);
            $table->json('tags')->nullable();
            
            // Statistics
            $table->integer('views')->default(0);
            $table->integer('unique_views')->default(0);
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->integer('rating_count')->default(0);
            $table->integer('completion_rate')->default(0); // Average completion percentage
            
            // Publishing
            $table->timestamp('published_at')->nullable();
            $table->timestamp('scheduled_at')->nullable(); // For scheduled publishing
            
            // Downloadable content
            $table->json('downloadable_resources')->nullable(); // PDFs, code files, etc.
            $table->boolean('allow_download')->default(false);
            
            // SEO
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords')->nullable();
            
            // Video processing status
            $table->enum('processing_status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->text('processing_error')->nullable();
            $table->timestamp('processed_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['series_id', 'status']);
            $table->index(['visibility', 'status']);
            $table->index(['published_at']);
            $table->index(['episode_number', 'series_id']);
            $table->index(['processing_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};