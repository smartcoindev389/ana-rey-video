<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicketReply extends Model
{
    protected $fillable = [
        'support_ticket_id',
        'user_id',
        'message',
        'is_admin_reply',
        'attachments',
    ];

    protected $casts = [
        'is_admin_reply' => 'boolean',
        'attachments' => 'array',
    ];

    /**
     * Get the support ticket this reply belongs to
     */
    public function supportTicket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class);
    }

    /**
     * Get the user who made this reply
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
