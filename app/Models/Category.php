<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasTranslations;

class Category extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'short_description',
        'color',
        'icon',
        'image',
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

    protected $appends = ['image_url', 'thumbnail_url', 'cover_image_url'];

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

    /**
     * Get translatable fields for this model
     */
    protected function getTranslatableFields(): array
    {
        return ['name', 'description', 'short_description', 'meta_title', 'meta_description'];
    }

    /**
     * Get name in current locale
     */
    public function getNameAttribute($value): ?string
    {
        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        // Use raw attribute to avoid recursion
        $rawValue = $this->attributes['name'] ?? $value;
        $translation = $this->getTranslation('name', $locale);
        return $translation ?: $rawValue;
    }

    /**
     * Get description in current locale
     */
    public function getDescriptionAttribute($value): ?string
    {
        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        // Use raw attribute to avoid recursion
        $rawValue = $this->attributes['description'] ?? $value;
        $translation = $this->getTranslation('description', $locale);
        return $translation ?: $rawValue;
    }

    /**
     * Get short_description in current locale
     */
    public function getShortDescriptionAttribute($value): ?string
    {
        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        // Use raw attribute to avoid recursion
        $rawValue = $this->attributes['short_description'] ?? $value;
        $translation = $this->getTranslation('short_description', $locale);
        return $translation ?: $rawValue;
    }

    /**
     * Get meta_title in current locale
     */
    public function getMetaTitleAttribute($value): ?string
    {
        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        // Use raw attribute to avoid recursion
        $rawValue = $this->attributes['meta_title'] ?? $value;
        $translation = $this->getTranslation('meta_title', $locale);
        return $translation ?: $rawValue;
    }

    /**
     * Get meta_description in current locale
     */
    public function getMetaDescriptionAttribute($value): ?string
    {
        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        // Use raw attribute to avoid recursion
        $rawValue = $this->attributes['meta_description'] ?? $value;
        $translation = $this->getTranslation('meta_description', $locale);
        return $translation ?: $rawValue;
    }

    /**
     * Get the full image URL.
     */
    public function getImageUrlAttribute(): ?string
    {
        if ($this->image) {
            if (str_starts_with($this->image, 'http')) {
                return $this->image;
            }
            return url('storage/' . $this->image);
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
     * Get the full cover image URL.
     */
    public function getCoverImageUrlAttribute(): ?string
    {
        if ($this->cover_image) {
            if (str_starts_with($this->cover_image, 'http')) {
                return $this->cover_image;
            }
            return url('storage/' . $this->cover_image);
        }
        return null;
    }
}