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
        Schema::create('series', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->text('short_description')->nullable();
            $table->enum('visibility', ['freemium', 'basic', 'premium'])->default('freemium');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('instructor_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Media fields
            $table->string('thumbnail')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('trailer_url')->nullable();
            
            // SEO fields
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords')->nullable();
            
            // Statistics
            $table->integer('video_count')->default(0);
            $table->integer('total_duration')->default(0); // in seconds
            $table->integer('total_views')->default(0);
            $table->decimal('rating', 3, 2)->default(0.00); // 0.00 to 5.00
            $table->integer('rating_count')->default(0);
            
            // Pricing (for premium content)
            $table->decimal('price', 8, 2)->nullable();
            $table->boolean('is_free')->default(true);
            
            // Publishing
            $table->timestamp('published_at')->nullable();
            $table->timestamp('featured_until')->nullable();
            $table->boolean('is_featured')->default(false);
            
            // Sorting and organization
            $table->integer('sort_order')->default(0);
            $table->json('tags')->nullable(); // Array of tags
            
            $table->timestamps();
            
            // Indexes
            $table->index(['status', 'visibility']);
            $table->index(['category_id', 'status']);
            $table->index(['is_featured', 'published_at']);
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('series');
    }
};