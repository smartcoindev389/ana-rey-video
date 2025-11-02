<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasTranslations;

class VideoComment extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = [
        'video_id',
        'user_id',
        'comment',
        'likes_count',
        'replies_count',
        'parent_id',
        'comment_time',
    ];

    protected $casts = [
        'comment_time' => 'integer', // Time in seconds where comment was made
        'likes_count' => 'integer',
        'replies_count' => 'integer',
    ];

    protected $with = ['user'];

    /**
     * Get the video that owns the comment.
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * Get the user that made the comment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent comment (if this is a reply).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(VideoComment::class, 'parent_id');
    }

    /**
     * Get the replies to this comment.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(VideoComment::class, 'parent_id')->orderBy('created_at', 'asc');
    }

    /**
     * Check if a user has liked this comment.
     */
    public function isLikedBy(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        return $this->likes()->where('user_id', $user->id)->exists();
    }

    /**
     * Get the users who liked this comment.
     */
    public function likes()
    {
        return $this->belongsToMany(User::class, 'video_comment_likes')
            ->withTimestamps();
    }

    /**
     * Increment likes count.
     */
    public function incrementLikes(): void
    {
        $this->increment('likes_count');
    }

    /**
     * Decrement likes count.
     */
    public function decrementLikes(): void
    {
        $this->decrement('likes_count');
    }

    /**
     * Scope to get top-level comments only (no parent).
     */
    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope to get comments for a specific video.
     */
    public function scopeForVideo($query, int $videoId)
    {
        return $query->where('video_id', $videoId);
    }

    /**
     * Scope to order by most liked.
     */
    public function scopeMostLiked($query)
    {
        return $query->orderBy('likes_count', 'desc')->orderBy('created_at', 'desc');
    }

    /**
     * Scope to order by newest first.
     */
    public function scopeNewest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Get translatable fields for this model
     */
    protected function getTranslatableFields(): array
    {
        return ['comment'];
    }

    /**
     * Get comment in current locale
     */
    public function getCommentAttribute($value): ?string
    {
        $locale = app()->getLocale();
        if ($locale === 'en') {
            return $value;
        }
        // Use raw attribute to avoid recursion
        $rawValue = $this->attributes['comment'] ?? $value;
        $translation = $this->getTranslation('comment', $locale);
        return $translation ?: $rawValue;
    }
}
