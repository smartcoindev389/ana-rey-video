<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasTranslations;

class SubscriptionPlan extends Model
{
    use HasTranslations;
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'price',
        'duration_days',
        'features',
        'max_devices',
        'video_quality',
        'downloadable_content',
        'certificates',
        'priority_support',
        'ad_free',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'features' => 'array',
        'downloadable_content' => 'boolean',
        'certificates' => 'boolean',
        'priority_support' => 'boolean',
        'ad_free' => 'boolean',
        'is_active' => 'boolean',
        'price' => 'decimal:2',
    ];

    /**
     * Get subscriptions for this plan
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Check if plan is free
     */
    public function isFree(): bool
    {
        return $this->price == 0;
    }

    /**
     * Get active plans
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get plans ordered by sort order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Get translatable fields for this model
     */
    protected function getTranslatableFields(): array
    {
        return ['display_name', 'description'];
    }

    /**
     * Get display name attribute with translation
     */
    public function getDisplayNameAttribute($value): ?string
    {
        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        // Use raw attribute to avoid recursion
        $rawValue = $this->attributes['display_name'] ?? $value;
        $translation = $this->getTranslation('display_name', $locale);
        return $translation ?: $rawValue;
    }

    /**
     * Get description attribute with translation
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
}
