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
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // freemium, basic, premium
            $table->string('display_name'); // Freemium, Basic, Premium
            $table->text('description')->nullable();
            $table->decimal('price', 8, 2)->default(0); // Monthly price
            $table->integer('duration_days')->default(30); // Subscription duration in days
            $table->json('features')->nullable(); // JSON array of features
            $table->integer('max_devices')->default(1);
            $table->string('video_quality')->default('SD'); // SD, HD, 4K
            $table->boolean('downloadable_content')->default(false);
            $table->boolean('certificates')->default(false);
            $table->boolean('priority_support')->default(false);
            $table->boolean('ad_free')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
