<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
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
}
