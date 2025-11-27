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
        'stripe_price_id',
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
        // If value is null, return null
        if ($value === null) {
            return null;
        }

        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        
        // Only try to get translation if model exists and has an ID
        if (!$this->exists || !$this->id) {
            return $value;
        }
        
        try {
        $translation = $this->getTranslation('display_name', $locale);
            return $translation ?: $value;
        } catch (\Exception $e) {
            // If translation lookup fails, return original value
            \Log::warning('Failed to get translation for display_name', [
                'model_id' => $this->id,
                'locale' => $locale,
                'error' => $e->getMessage()
            ]);
            return $value;
        }
    }

    /**
     * Get description attribute with translation
     */
    public function getDescriptionAttribute($value): ?string
    {
        // If value is null, return null
        if ($value === null) {
            return null;
        }

        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        
        // Only try to get translation if model exists and has an ID
        if (!$this->exists || !$this->id) {
            return $value;
        }
        
        try {
        $translation = $this->getTranslation('description', $locale);
            return $translation ?: $value;
        } catch (\Exception $e) {
            // If translation lookup fails, return original value
            \Log::warning('Failed to get translation for description', [
                'model_id' => $this->id,
                'locale' => $locale,
                'error' => $e->getMessage()
            ]);
            return $value;
        }
    }

    /**
     * Get Stripe Price ID attribute.
     *
     * For flexible, admin-managed plans we treat the database column
     * `subscription_plans.stripe_price_id` as the single source of truth.
     * If it's empty, the plan is considered not configured for Stripe.
     */
    public function getStripePriceIdAttribute($value): ?string
    {
        return !empty($value) ? $value : null;
    }
}
