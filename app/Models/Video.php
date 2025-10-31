<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Models\VideoComment;
use Illuminate\Support\Str;

class Video extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'short_description',
        'category_id',
        'instructor_id',
        'video_url',
        'video_file_path',
        'thumbnail',
        'intro_image',
        'intro_description',
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

    protected $appends = ['video_url_full', 'intro_image_url', 'thumbnail_url', 'series_id'];

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName()
    {
        return 'id';
    }

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
            // Update category statistics when video is saved
            if ($video->category) {
                $video->category->updateStatistics();
            }
        });

        static::deleted(function ($video) {
            // Update category statistics when video is deleted
            if ($video->category) {
                $video->category->updateStatistics();
            }
        });
    }

    /**
     * Get the category that owns the video.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
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
     * Get comments for this video.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(VideoComment::class);
    }

    /**
     * Get the full video URL.
     */
    public function getVideoUrlFullAttribute(): ?string
    {
        if ($this->video_file_path) {
            // If it starts with http, it's already a full URL
            if (str_starts_with($this->video_file_path, 'http')) {
                return $this->video_file_path;
            }
            // Use streaming endpoint - it properly handles Range requests which are required for video playback
            return url("api/videos/{$this->id}/stream");
        }
        return $this->video_url;
    }

    /**
     * Get the full intro image URL.
     */
    public function getIntroImageUrlAttribute(): ?string
    {
        if ($this->intro_image) {
            if (str_starts_with($this->intro_image, 'http')) {
                return $this->intro_image;
            }
            return url('storage/' . $this->intro_image);
        }
        return null;
    }

    /**
     * Get the full thumbnail URL.
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        if ($this->thumbnail) {
            if (str_starts_with($this->thumbnail, 'http')) {
                return $this->thumbnail;
            }
            return url('storage/' . $this->thumbnail);
        }
        return null;
    }

    /**
     * Get series_id (alias for category_id for frontend compatibility).
     */
    public function getSeriesIdAttribute(): ?int
    {
        return $this->category_id;
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
    public function scopeVisibleTo($query, ?string $subscriptionType)
    {
        // Default to freemium if subscription_type is null/empty
        $subscriptionType = $subscriptionType ?: 'freemium';
        
        // Admin can see all content
        if ($subscriptionType === 'admin') {
            return $query;
        }
        
        return $query->where(function ($q) use ($subscriptionType) {
            $q->where('visibility', 'freemium')
              ->orWhere('visibility', 'basic')
              ->when($subscriptionType === 'premium', function ($qq) {
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
    public function isAccessibleTo(?User $user = null): bool
    {
        // Admin can access everything
        if ($user && $user->role === 'admin') {
            return true;
        }

        // Check visibility
        switch ($this->visibility) {
            case 'freemium':
                return true;
            case 'basic':
                return $user && in_array($user->subscription_type, ['basic', 'premium', 'admin']);
            case 'premium':
                return $user && in_array($user->subscription_type, ['premium', 'admin']);
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
        
        // Also increment category views
        if ($this->category) {
            $this->category->increment('total_views');
        }
    }

    /**
     * Get next video in category.
     */
    public function getNextVideo()
    {
        return $this->category->videos()
            ->published()
            ->where('sort_order', '>', $this->sort_order)
            ->orderBy('sort_order')
            ->first();
    }

    /**
     * Get previous video in category.
     */
    public function getPreviousVideo()
    {
        return $this->category->videos()
            ->published()
            ->where('sort_order', '<', $this->sort_order)
            ->orderBy('sort_order', 'desc')
            ->first();
    }
}