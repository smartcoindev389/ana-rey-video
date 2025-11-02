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
        Schema::create('translations', function (Blueprint $table) {
            $table->id();
            $table->string('key')->index(); // Translation key (e.g., 'common.home', 'auth.welcome_back')
            $table->string('locale', 10)->default('en')->index(); // Language code (en, es, pt)
            $table->text('value'); // Translated text
            $table->string('group')->nullable()->index(); // Group/category (common, auth, hero, etc.)
            $table->timestamps();
            
            // Unique constraint: same key + locale combination
            $table->unique(['key', 'locale']);
            
            // Indexes for faster queries
            $table->index(['group', 'locale']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};
