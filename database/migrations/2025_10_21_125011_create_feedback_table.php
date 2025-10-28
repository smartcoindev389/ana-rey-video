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
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['bug_report', 'feature_request', 'general_feedback', 'complaint']);
            $table->string('subject');
            $table->text('description');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['new', 'reviewed', 'in_progress', 'resolved', 'rejected'])->default('new');
            $table->string('category')->nullable();
            $table->integer('rating')->nullable(); // 1-5 star rating
            $table->json('metadata')->nullable();
            $table->datetime('resolved_at')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['type', 'status']);
            $table->index(['priority', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['assigned_to', 'status']);
            $table->index('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};