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
        Schema::table('testimonials', function (Blueprint $table) {
            // Add feedback/suggestion specific fields
            $table->enum('type', ['testimonial', 'feedback', 'suggestion'])->default('testimonial')->after('video_id');
            $table->string('subject')->nullable()->after('type');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->after('is_approved');
            $table->enum('priority', ['low', 'medium', 'high'])->nullable()->after('status');
            $table->string('category')->nullable()->after('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->dropColumn(['type', 'subject', 'status', 'priority', 'category']);
        });
    }
};
