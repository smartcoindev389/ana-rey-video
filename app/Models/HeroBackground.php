<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class HeroBackground extends Model
{
    protected $fillable = [
        'name',
        'description',
        'image_path',
        'image_url',
        'is_active',
        'sort_order',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'metadata' => 'array',
    ];

    /**
     * Scope to get active backgrounds
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by sort order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Accessor: Ensure image_url is always a valid public URL.
     * - Prefer stored URL if it already points to /storage
     * - Fix legacy absolute URLs missing /storage by using image_path
     * - If value is a relative path, convert with Storage::url
     * - If empty, fall back to image_path
     */
    public function getImageUrlAttribute($value)
    {
        // If it's already a full URL that contains /storage, return as is
        if (is_string($value) && str_starts_with($value, 'http') && str_contains($value, '/storage/')) {
            return $value;
        }

        // If it's already a relative path starting with /storage/, return as is
        if (is_string($value) && str_starts_with($value, '/storage/')) {
            return $value;
        }

        // If it's a full URL but missing /storage, attempt to fix using image_path
        if (is_string($value) && str_starts_with($value, 'http') && !str_contains($value, '/storage/')) {
            if (!empty($this->attributes['image_path'])) {
                return Storage::url($this->attributes['image_path']);
            }
        }

        // If it's a relative path (not starting with /storage/), convert via storage helper
        if (is_string($value) && !str_starts_with($value, 'http') && !str_starts_with($value, '/storage/') && !empty($value)) {
            return Storage::url($value);
        }

        // Fallback to image_path if image_url is empty or invalid
        if (empty($value) && !empty($this->attributes['image_path'])) {
            return Storage::url($this->attributes['image_path']);
        }

        // Return empty string if nothing is available (frontend will handle fallback)
        return $value ?? '';
    }
}
