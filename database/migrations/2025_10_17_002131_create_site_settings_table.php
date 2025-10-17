<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'hero_title', 'hero_subtitle', 'cta_button_text'
            $table->text('value'); // The actual text content
            $table->string('type')->default('text'); // text, number, boolean, json
            $table->string('group')->default('general'); // general, hero, footer, etc.
            $table->string('label')->nullable(); // Human-readable label for admin panel
            $table->text('description')->nullable(); // Help text for admin
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};