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
        'color',
        'icon',
        'image',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['image_url'];

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName()
    {
        return 'id';
    }

    /**
     * Get the series for the category.
     */
    public function series(): HasMany
    {
        return $this->hasMany(Series::class);
    }

    /**
     * Get the published series for the category.
     */
    public function publishedSeries(): HasMany
    {
        return $this->series()->where('status', 'published');
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
     * Get translatable fields for this model
     */
    protected function getTranslatableFields(): array
    {
        return ['name', 'description'];
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

}