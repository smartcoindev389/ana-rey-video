<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProgress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'series_id',
        'video_id',
        'progress_percentage',
        'time_watched',
        'last_position',
        'is_completed',
        'completed_at',
        'video_duration',
        'watch_history',
        'watch_count',
        'videos_completed',
        'total_videos',
        'series_progress',
        'rating',
        'review',
        'is_favorite',
        'favorited_at',
        'last_watched_at',
        'first_watched_at',
        'total_watch_time',
    ];

    protected $casts = [
        'watch_history' => 'array',
        'is_completed' => 'boolean',
        'is_favorite' => 'boolean',
        'completed_at' => 'datetime',
        'favorited_at' => 'datetime',
        'last_watched_at' => 'datetime',
        'first_watched_at' => 'datetime',
        'progress_percentage' => 'integer',
        'time_watched' => 'integer',
        'last_position' => 'integer',
        'video_duration' => 'integer',
        'watch_count' => 'integer',
        'videos_completed' => 'integer',
        'total_videos' => 'integer',
        'series_progress' => 'decimal:2',
        'rating' => 'integer',
        'total_watch_time' => 'integer',
    ];

    /**
     * Get the user that owns the progress.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the series that owns the progress.
     */
    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    /**
     * Get the video that owns the progress.
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * Scope a query to only include completed progress.
     */
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    /**
     * Scope a query to only include favorite progress.
     */
    public function scopeFavorites($query)
    {
        return $query->where('is_favorite', true);
    }

    /**
     * Scope a query for a specific user.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Update progress for a video.
     */
    public static function updateVideoProgress(User $user, Video $video, int $timeWatched, int $videoDuration)
    {
        $progressPercentage = $videoDuration > 0 ? min(100, round(($timeWatched / $videoDuration) * 100)) : 0;
        $isCompleted = $progressPercentage >= 90; // Consider 90% as completed

        $progress = static::updateOrCreate(
            [
                'user_id' => $user->id,
                'video_id' => $video->id,
            ],
            [
                'series_id' => $video->series_id,
                'progress_percentage' => $progressPercentage,
                'time_watched' => $timeWatched,
                'last_position' => $timeWatched,
                'is_completed' => $isCompleted,
                'completed_at' => $isCompleted ? now() : null,
                'video_duration' => $videoDuration,
                'watch_count' => \DB::raw('watch_count + 1'),
                'last_watched_at' => now(),
                'total_watch_time' => \DB::raw('total_watch_time + ' . $timeWatched),
                'first_watched_at' => \DB::raw('COALESCE(first_watched_at, NOW())'),
            ]
        );

        // Update series progress
        if ($video->series_id) {
            $progress->updateSeriesProgress($user, $video->series);
        }

        return $progress;
    }

    /**
     * Update series progress.
     */
    public function updateSeriesProgress(User $user, Series $series)
    {
        $seriesProgress = static::where('user_id', $user->id)
            ->where('series_id', $series->id);

        $totalVideos = $series->publishedVideos()->count();
        $completedVideos = $seriesProgress->completed()->count();

        $seriesProgressPercentage = $totalVideos > 0 ? round(($completedVideos / $totalVideos) * 100, 2) : 0;

        // Update or create series progress
        static::updateOrCreate(
            [
                'user_id' => $user->id,
                'series_id' => $series->id,
            ],
            [
                'videos_completed' => $completedVideos,
                'total_videos' => $totalVideos,
                'series_progress' => $seriesProgressPercentage,
            ]
        );
    }

    /**
     * Get user's learning statistics.
     */
    public static function getUserStats(User $user)
    {
        $totalVideosWatched = static::forUser($user->id)->count();
        $totalSeriesStarted = static::forUser($user->id)->whereNotNull('series_id')->distinct('series_id')->count();
        $totalSeriesCompleted = static::forUser($user->id)->where('series_progress', '>=', 100)->distinct('series_id')->count();
        $totalWatchTime = static::forUser($user->id)->sum('total_watch_time');

        return [
            'total_videos_watched' => $totalVideosWatched,
            'total_series_started' => $totalSeriesStarted,
            'total_series_completed' => $totalSeriesCompleted,
            'total_watch_time' => $totalWatchTime,
            'formatted_watch_time' => static::formatDuration($totalWatchTime),
        ];
    }

    /**
     * Format duration in seconds to human readable format.
     */
    public static function formatDuration(int $seconds): string
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);

        if ($hours > 0) {
            return $hours . 'h ' . $minutes . 'm';
        }

        return $minutes . 'm';
    }
}