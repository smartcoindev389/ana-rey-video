<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Video extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'short_description',
        'series_id',
        'instructor_id',
        'video_url',
        'video_file_path',
        'thumbnail',
        'duration',
        'file_size',
        'video_format',
        'video_quality',
        'streaming_urls',
        'hls_url',
        'dash_url',
        'visibility',
        'status',
        'is_free',
        'price',
        'episode_number',
        'sort_order',
        'tags',
        'views',
        'unique_views',
        'rating',
        'rating_count',
        'completion_rate',
        'published_at',
        'scheduled_at',
        'downloadable_resources',
        'allow_download',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'processing_status',
        'processing_error',
        'processed_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'processed_at' => 'datetime',
        'streaming_urls' => 'array',
        'tags' => 'array',
        'downloadable_resources' => 'array',
        'is_free' => 'boolean',
        'allow_download' => 'boolean',
        'duration' => 'integer',
        'file_size' => 'integer',
        'views' => 'integer',
        'unique_views' => 'integer',
        'rating' => 'decimal:2',
        'rating_count' => 'integer',
        'completion_rate' => 'integer',
        'episode_number' => 'integer',
        'sort_order' => 'integer',
        'price' => 'decimal:2',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($video) {
            if (empty($video->slug)) {
                $video->slug = Str::slug($video->title);
            }
        });

        static::updating(function ($video) {
            if ($video->isDirty('title') && empty($video->slug)) {
                $video->slug = Str::slug($video->title);
            }
        });

        static::saved(function ($video) {
            // Update series statistics when video is saved
            if ($video->series) {
                $video->series->updateStatistics();
            }
        });

        static::deleted(function ($video) {
            // Update series statistics when video is deleted
            if ($video->series) {
                $video->series->updateStatistics();
            }
        });
    }

    /**
     * Get the series that owns the video.
     */
    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    /**
     * Get the instructor that owns the video.
     */
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /**
     * Get user progress for this video.
     */
    public function userProgress(): HasMany
    {
        return $this->hasMany(UserProgress::class);
    }

    /**
     * Scope a query to only include published videos.
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                    ->whereNotNull('published_at')
                    ->where('published_at', '<=', now());
    }

    /**
     * Scope a query to filter by visibility.
     */
    public function scopeVisibleTo($query, string $subscriptionType)
    {
        return $query->where(function ($q) use ($subscriptionType) {
            $q->where('visibility', 'freemium')
              ->orWhere('visibility', 'basic')
              ->when($subscriptionType === 'premium' || $subscriptionType === 'admin', function ($qq) {
                  $qq->orWhere('visibility', 'premium');
              });
        });
    }

    /**
     * Scope a query to only include videos in a series.
     */
    public function scopeInSeries($query, int $seriesId)
    {
        return $query->where('series_id', $seriesId);
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName()
    {
        return 'slug';
    }

    /**
     * Get formatted duration.
     */
    public function getFormattedDurationAttribute()
    {
        $hours = floor($this->duration / 3600);
        $minutes = floor(($this->duration % 3600) / 60);
        $seconds = $this->duration % 60;

        if ($hours > 0) {
            return sprintf('%d:%02d:%02d', $hours, $minutes, $seconds);
        }

        return sprintf('%d:%02d', $minutes, $seconds);
    }

    /**
     * Get formatted file size.
     */
    public function getFormattedFileSizeAttribute()
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get the average rating.
     */
    public function getAverageRatingAttribute()
    {
        return $this->rating_count > 0 ? round($this->rating / $this->rating_count, 1) : 0;
    }

    /**
     * Check if video is accessible to user.
     */
    public function isAccessibleTo(User $user): bool
    {
        // Admin can access everything
        if ($user->role === 'admin') {
            return true;
        }

        // Check visibility
        switch ($this->visibility) {
            case 'freemium':
                return true;
            case 'basic':
                return in_array($user->subscription_type, ['basic', 'premium', 'admin']);
            case 'premium':
                return in_array($user->subscription_type, ['premium', 'admin']);
            default:
                return false;
        }
    }

    /**
     * Increment view count.
     */
    public function incrementViews()
    {
        $this->increment('views');
        
        // Also increment series views
        if ($this->series) {
            $this->series->increment('total_views');
        }
    }

    /**
     * Get next video in series.
     */
    public function getNextVideo()
    {
        return $this->series->videos()
            ->published()
            ->where('sort_order', '>', $this->sort_order)
            ->orderBy('sort_order')
            ->first();
    }

    /**
     * Get previous video in series.
     */
    public function getPreviousVideo()
    {
        return $this->series->videos()
            ->published()
            ->where('sort_order', '<', $this->sort_order)
            ->orderBy('sort_order', 'desc')
            ->first();
    }
}