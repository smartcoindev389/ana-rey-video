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
        Schema::table('videos', function (Blueprint $table) {
            // Add thumbnail column if it does not exist yet
            if (!Schema::hasColumn('videos', 'thumbnail')) {
                $table->string('thumbnail')->nullable()->after('video_file_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            if (Schema::hasColumn('videos', 'thumbnail')) {
                $table->dropColumn('thumbnail');
            }
        });
    }
};



