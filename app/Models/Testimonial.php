<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Testimonial extends Model
{
    protected $fillable = [
        'user_id',
        'video_id',
        'type', // 'testimonial', 'feedback', 'suggestion'
        'subject',
        'name',
        'role',
        'company',
        'avatar',
        'content',
        'rating',
        'is_approved',
        'status', // 'pending', 'approved', 'rejected'
        'priority', // 'low', 'medium', 'high'
        'category',
        'is_featured',
        'sort_order',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'is_featured' => 'boolean',
        'rating' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * Scope to get feedback type testimonials.
     */
    public function scopeFeedback($query)
    {
        return $query->where('type', 'feedback');
    }

    /**
     * Scope to get suggestion type testimonials.
     */
    public function scopeSuggestion($query)
    {
        return $query->where('type', 'suggestion');
    }

    /**
     * Scope to get testimonial type testimonials.
     */
    public function scopeTestimonial($query)
    {
        return $query->where('type', 'testimonial');
    }

    /**
     * Scope to get by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Get the user that owns the testimonial.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the video associated with the testimonial.
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * Scope a query to only include approved testimonials.
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope a query to only include featured testimonials.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}
