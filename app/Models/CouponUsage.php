<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CouponUsage extends Model
{
    protected $fillable = [
        'coupon_id',
        'user_id',
        'amount',
        'discount_amount',
        'used_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'used_at' => 'datetime',
    ];

    /**
     * Get the coupon that was used
     */
    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * Get the user who used the coupon
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
