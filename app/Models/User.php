<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'subscription_type',
        'subscription_started_at',
        'subscription_expires_at',
        'role',
        'bio',
        'avatar',
        'website',
        'social_links',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'subscription_started_at' => 'datetime',
            'subscription_expires_at' => 'datetime',
            'last_login_at' => 'datetime',
            'social_links' => 'array',
            'password' => 'hashed',
        ];
    }

    /**
     * Check if user has an active subscription
     */
    public function isSubscriptionActive(): bool
    {
        // Freemium users are always active
        if ($this->subscription_type === 'freemium') {
            return true;
        }

        // Check if subscription hasn't expired
        return $this->subscription_expires_at && $this->subscription_expires_at->isFuture();
    }

    /**
     * Check if user has premium subscription
     */
    public function isPremium(): bool
    {
        return $this->subscription_type === 'premium' && $this->isSubscriptionActive();
    }

    /**
     * Check if user has basic subscription
     */
    public function isBasic(): bool
    {
        return $this->subscription_type === 'basic' && $this->isSubscriptionActive();
    }

    /**
     * Check if user has freemium subscription
     */
    public function isFreemium(): bool
    {
        return $this->subscription_type === 'freemium';
    }

    /**
     * Get days remaining in subscription
     */
    public function daysRemaining(): ?int
    {
        if (!$this->subscription_expires_at) {
            return null;
        }

        return max(0, now()->diffInDays($this->subscription_expires_at, false));
    }

    /**
     * Get user's subscriptions
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get user's active subscription
     */
    public function activeSubscription()
    {
        return $this->hasMany(Subscription::class)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->latest()
            ->first();
    }

    /**
     * Get user's payment transactions
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin' || $this->subscription_type === 'admin';
    }

    /**
     * Check if user is regular user (not admin)
     */
    public function isUser(): bool
    {
        return $this->role === 'user' && $this->subscription_type !== 'admin';
    }

    /**
     * Get user's total spent on subscriptions
     */
    public function totalSpent(): float
    {
        return $this->transactions()
            ->where('status', 'completed')
            ->sum('amount');
    }

    /**
     * Check if user has any active subscription
     */
    public function hasActiveSubscription(): bool
    {
        return $this->activeSubscription() !== null || $this->isSubscriptionActive();
    }

    /**
     * Get the series created by the user (as instructor).
     */
    public function series(): HasMany
    {
        return $this->hasMany(Series::class, 'instructor_id');
    }

    /**
     * Get the videos created by the user (as instructor).
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'instructor_id');
    }

    /**
     * Get the user's progress records.
     */
    public function progress(): HasMany
    {
        return $this->hasMany(UserProgress::class);
    }

    /**
     * Get user's learning statistics.
     */
    public function getLearningStats()
    {
        return UserProgress::getUserStats($this);
    }
}
