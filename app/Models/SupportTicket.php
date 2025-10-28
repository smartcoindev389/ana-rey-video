<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    protected $fillable = [
        'user_id',
        'ticket_number',
        'subject',
        'description',
        'priority',
        'status',
        'category',
        'assigned_to',
        'resolved_at',
        'closed_at',
        'tags',
        'attachments',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'tags' => 'array',
        'attachments' => 'array',
    ];

    /**
     * Get the user who created the ticket
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin assigned to the ticket
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get ticket replies
     */
    public function replies(): HasMany
    {
        return $this->hasMany(SupportTicketReply::class);
    }

    /**
     * Check if ticket is open
     */
    public function isOpen(): bool
    {
        return in_array($this->status, ['open', 'in_progress', 'pending']);
    }

    /**
     * Check if ticket is closed
     */
    public function isClosed(): bool
    {
        return in_array($this->status, ['resolved', 'closed']);
    }

    /**
     * Check if ticket is resolved
     */
    public function isResolved(): bool
    {
        return $this->status === 'resolved';
    }

    /**
     * Mark ticket as resolved
     */
    public function markAsResolved(): void
    {
        $this->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);
    }

    /**
     * Mark ticket as closed
     */
    public function markAsClosed(): void
    {
        $this->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);
    }

    /**
     * Reopen ticket
     */
    public function reopen(): void
    {
        $this->update([
            'status' => 'open',
            'resolved_at' => null,
            'closed_at' => null,
        ]);
    }

    /**
     * Generate unique ticket number
     */
    public static function generateTicketNumber(): string
    {
        do {
            $number = 'TICKET-' . strtoupper(substr(uniqid(), -8));
        } while (static::where('ticket_number', $number)->exists());

        return $number;
    }

    /**
     * Scope to get open tickets
     */
    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['open', 'in_progress', 'pending']);
    }

    /**
     * Scope to get closed tickets
     */
    public function scopeClosed($query)
    {
        return $query->whereIn('status', ['resolved', 'closed']);
    }

    /**
     * Scope to get tickets by priority
     */
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope to get tickets by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get tickets by category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }
}
