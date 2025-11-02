<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;
use App\Traits\HasTranslations;

class Coupon extends Model
{
    use HasTranslations;
    protected $fillable = [
        'code',
        'name',
        'description',
        'type', // 'percentage', 'fixed_amount', 'free_trial'
        'value',
        'minimum_amount',
        'maximum_discount',
        'usage_limit',
        'usage_limit_per_user',
        'used_count',
        'valid_from',
        'valid_until',
        'is_active',
        'applicable_plans',
        'first_time_only',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'minimum_amount' => 'decimal:2',
        'maximum_discount' => 'decimal:2',
        'usage_limit' => 'integer',
        'usage_limit_per_user' => 'integer',
        'used_count' => 'integer',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
        'applicable_plans' => 'array',
        'first_time_only' => 'boolean',
    ];

    /**
     * Get coupon usages
     */
    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    /**
     * Check if coupon is valid
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = now();
        if ($this->valid_from && $this->valid_from->isFuture()) {
            return false;
        }

        if ($this->valid_until && $this->valid_until->isPast()) {
            return false;
        }

        if ($this->usage_limit && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    /**
     * Check if coupon can be used by user
     */
    public function canBeUsedBy(User $user): bool
    {
        if (!$this->isValid()) {
            return false;
        }

        // Check usage limit per user
        if ($this->usage_limit_per_user) {
            $userUsageCount = $this->usages()->where('user_id', $user->id)->count();
            if ($userUsageCount >= $this->usage_limit_per_user) {
                return false;
            }
        }

        // Check first time only
        if ($this->first_time_only) {
            $hasUsedBefore = CouponUsage::where('user_id', $user->id)
                ->whereHas('coupon', function ($query) {
                    $query->where('first_time_only', true);
                })
                ->exists();

            if ($hasUsedBefore) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate discount amount
     */
    public function calculateDiscount(float $amount): float
    {
        if (!$this->isValid()) {
            return 0;
        }

        // Check minimum amount requirement
        if ($this->minimum_amount && $amount < $this->minimum_amount) {
            return 0;
        }

        $discount = 0;

        switch ($this->type) {
            case 'percentage':
                $discount = ($amount * $this->value) / 100;
                break;
            case 'fixed_amount':
                $discount = $this->value;
                break;
            case 'free_trial':
                $discount = $amount; // 100% discount for free trial
                break;
        }

        // Apply maximum discount limit
        if ($this->maximum_discount && $discount > $this->maximum_discount) {
            $discount = $this->maximum_discount;
        }

        return min($discount, $amount); // Don't discount more than the total amount
    }

    /**
     * Check if coupon applies to specific plan
     */
    public function appliesToPlan(string $planName): bool
    {
        if (empty($this->applicable_plans)) {
            return true; // Applies to all plans
        }

        return in_array($planName, $this->applicable_plans);
    }

    /**
     * Use the coupon
     */
    public function use(User $user, float $amount): CouponUsage
    {
        $discount = $this->calculateDiscount($amount);

        $usage = $this->usages()->create([
            'user_id' => $user->id,
            'amount' => $amount,
            'discount_amount' => $discount,
        ]);

        $this->increment('used_count');

        return $usage;
    }

    /**
     * Scope to get active coupons
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get valid coupons
     */
    public function scopeValid($query)
    {
        $now = now();
        return $query->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_from')->orWhere('valid_from', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_until')->orWhere('valid_until', '>=', $now);
            });
    }

    /**
     * Scope to get expired coupons
     */
    public function scopeExpired($query)
    {
        return $query->where('valid_until', '<', now());
    }

    /**
     * Get translatable fields for this model
     */
    protected function getTranslatableFields(): array
    {
        return ['name', 'description'];
    }

    /**
     * Get name attribute with translation
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
