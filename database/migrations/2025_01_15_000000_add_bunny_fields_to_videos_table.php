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
            // Add Bunny.net specific fields
            $table->string('bunny_video_id')->nullable()->after('video_file_path');
            $table->string('bunny_video_url')->nullable()->after('bunny_video_id');
            $table->string('bunny_embed_url')->nullable()->after('bunny_video_url');
            $table->string('bunny_thumbnail_url')->nullable()->after('bunny_embed_url');
            
            // Add index for bunny_video_id
            $table->index('bunny_video_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropIndex(['bunny_video_id']);
            $table->dropColumn([
                'bunny_video_id',
                'bunny_video_url',
                'bunny_embed_url',
                'bunny_thumbnail_url',
            ]);
        });
    }
};



