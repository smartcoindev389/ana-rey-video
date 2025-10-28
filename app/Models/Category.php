<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'short_description',
        'color',
        'icon',
        'is_active',
        'sort_order',
        // Series fields
        'visibility',
        'status',
        'instructor_id',
        'thumbnail',
        'cover_image',
        'trailer_url',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'video_count',
        'total_duration',
        'total_views',
        'rating',
        'rating_count',
        'price',
        'is_free',
        'published_at',
        'featured_until',
        'is_featured',
        'tags',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_free' => 'boolean',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
        'video_count' => 'integer',
        'total_duration' => 'integer',
        'total_views' => 'integer',
        'rating' => 'decimal:2',
        'rating_count' => 'integer',
        'price' => 'decimal:2',
        'published_at' => 'datetime',
        'featured_until' => 'datetime',
        'tags' => 'array',
    ];

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName()
    {
        return 'id';
    }

    /**
     * Get the instructor that owns the category.
     */
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /**
     * Get the videos for the category.
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    /**
     * Get the published videos for the category.
     */
    public function publishedVideos(): HasMany
    {
        return $this->videos()->where('status', 'published');
    }

    /**
     * Get user progress for this category.
     */
    public function userProgress(): HasMany
    {
        return $this->hasMany(UserProgress::class);
    }

    /**
     * Scope a query to only include published categories.
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                    ->whereNotNull('published_at');
    }

    /**
     * Scope a query to only include featured categories.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)
                    ->where(function ($q) {
                        $q->whereNull('featured_until')
                          ->orWhere('featured_until', '>', now());
                    });
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
     * Scope a query to only include active categories.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to order categories by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Get formatted duration.
     */
    public function getFormattedDurationAttribute()
    {
        $hours = floor($this->total_duration / 3600);
        $minutes = floor(($this->total_duration % 3600) / 60);

        if ($hours > 0) {
            return $hours . 'h ' . $minutes . 'm';
        }

        return $minutes . 'm';
    }

    /**
     * Get the average rating.
     */
    public function getAverageRatingAttribute()
    {
        return $this->rating_count > 0 ? round($this->rating / $this->rating_count, 1) : 0;
    }

    /**
     * Update category statistics.
     */
    public function updateStatistics()
    {
        $videos = $this->publishedVideos;
        
        $this->update([
            'video_count' => $videos->count(),
            'total_duration' => $videos->sum('duration'),
            'total_views' => $videos->sum('views'),
        ]);
    }

    /**
     * Check if category is accessible to user.
     */
    public function isAccessibleTo(?User $user = null): bool
    {
        // Admin can access everything
        if ($user && $user->isAdmin()) {
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
}