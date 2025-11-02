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
        Schema::create('content_translations', function (Blueprint $table) {
            $table->id();
            $table->string('translatable_type'); // Model class (App\Models\Video, App\Models\Faq, etc.)
            $table->unsignedBigInteger('translatable_id'); // Model ID
            $table->string('locale', 10)->default('en')->index(); // Language code (en, es, pt)
            $table->string('field'); // Field name (title, description, question, answer, etc.)
            $table->text('value'); // Translated text
            $table->timestamps();
            
            // Unique constraint: same model + locale + field combination
            $table->unique(['translatable_type', 'translatable_id', 'locale', 'field'], 'translatable_unique');
            
            // Indexes for faster queries (using shorter names)
            $table->index(['translatable_type', 'translatable_id', 'locale'], 'content_trans_type_id_locale_idx');
            $table->index(['translatable_type', 'translatable_id'], 'content_trans_type_id_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_translations');
    }
};