<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
