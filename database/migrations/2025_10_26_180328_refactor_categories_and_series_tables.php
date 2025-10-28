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
        // Step 1: Add series fields to categories table
        Schema::table('categories', function (Blueprint $table) {
            // Add short description
            $table->text('short_description')->nullable()->after('description');
            
            // Add visibility and status (using series concepts as category access control)
            $table->enum('visibility', ['freemium', 'basic', 'premium'])->default('freemium')->after('short_description');
            $table->enum('status', ['draft', 'published', 'archived'])->default('published')->after('visibility');
            
            // Add instructor reference
            $table->foreignId('instructor_id')->nullable()->constrained('users')->onDelete('set null')->after('status');
            
            // Add media fields
            $table->string('thumbnail')->nullable()->after('icon');
            $table->string('cover_image')->nullable()->after('thumbnail');
            $table->string('trailer_url')->nullable()->after('cover_image');
            
            // Add SEO fields
            $table->string('meta_title')->nullable()->after('trailer_url');
            $table->text('meta_description')->nullable()->after('meta_title');
            $table->string('meta_keywords')->nullable()->after('meta_description');
            
            // Add statistics
            $table->integer('video_count')->default(0)->after('meta_keywords');
            $table->integer('total_duration')->default(0)->after('video_count'); // in seconds
            $table->integer('total_views')->default(0)->after('total_duration');
            $table->decimal('rating', 3, 2)->default(0.00)->after('total_views'); // 0.00 to 5.00
            $table->integer('rating_count')->default(0)->after('rating');
            
            // Add pricing
            $table->decimal('price', 8, 2)->nullable()->after('rating_count');
            $table->boolean('is_free')->default(true)->after('price');
            
            // Add publishing fields
            $table->timestamp('published_at')->nullable()->after('is_free');
            $table->timestamp('featured_until')->nullable()->after('published_at');
            $table->boolean('is_featured')->default(false)->after('featured_until');
            
            // Add tags
            $table->json('tags')->nullable()->after('is_featured');
        });

        // Step 2: Update videos table to use category_id instead of series_id
        Schema::table('videos', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['series_id']);
        });
        
        // Drop indexes after foreign key is removed
        Schema::table('videos', function (Blueprint $table) {
            $table->dropIndex(['series_id', 'status']);
            $table->dropIndex(['episode_number', 'series_id']);
        });
        
        // Rename column and add indexes
        Schema::table('videos', function (Blueprint $table) {
            // Rename series_id to category_id
            $table->renameColumn('series_id', 'category_id');
        });
        
        // Add indexes and foreign key
        Schema::table('videos', function (Blueprint $table) {
            // Add indexes
            $table->index(['category_id', 'status'], 'videos_category_id_status_index');
            $table->index(['episode_number', 'category_id'], 'videos_episode_category_index');
            
            // Add foreign key constraint to categories
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');
        });

        // Step 3: Update user_progress table to use category_id instead of series_id
        Schema::table('user_progress', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['series_id']);
            
            // Rename series_id to category_id
            $table->renameColumn('series_id', 'category_id');
            
            // Add foreign key constraint to categories
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');
        });

        // Step 4: Drop series table
        Schema::dropIfExists('series');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate series table
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
            $table->integer('total_duration')->default(0);
            $table->integer('total_views')->default(0);
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->integer('rating_count')->default(0);
            
            // Pricing
            $table->decimal('price', 8, 2)->nullable();
            $table->boolean('is_free')->default(true);
            
            // Publishing
            $table->timestamp('published_at')->nullable();
            $table->timestamp('featured_until')->nullable();
            $table->boolean('is_featured')->default(false);
            
            // Sorting and organization
            $table->integer('sort_order')->default(0);
            $table->json('tags')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['status', 'visibility']);
            $table->index(['category_id', 'status']);
            $table->index(['is_featured', 'published_at']);
            $table->index('published_at');
        });

        // Revert user_progress changes
        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->renameColumn('category_id', 'series_id');
            $table->foreign('series_id')->references('id')->on('series')->onDelete('cascade');
        });

        // Revert videos changes
        Schema::table('videos', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropIndex('videos_category_id_status_index');
            $table->dropIndex('videos_episode_category_index');
            $table->renameColumn('category_id', 'series_id');
            $table->foreign('series_id')->references('id')->on('series')->onDelete('cascade');
            $table->index(['series_id', 'status']);
            $table->index(['episode_number', 'series_id']);
        });

        // Revert categories table
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn([
                'short_description',
                'visibility',
                'status',
                'instructor_id',
                'thumbnail',
                'cover_image',
                'trailer_url',
                'meta_title',
                'meta_description',
                'meta_keywords',
                'video_count',
                'total_duration',
                'total_views',
                'rating',
                'rating_count',
                'price',
                'is_free',
                'published_at',
                'featured_until',
                'is_featured',
                'tags',
            ]);
        });
    }
};
