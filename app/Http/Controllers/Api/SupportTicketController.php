<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class SupportTicketController extends Controller
{
    /**
     * Display a listing of support tickets.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SupportTicket::with(['user', 'assignedTo', 'replies']);

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->get('priority'));
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->get('category'));
        }

        // Filter by assigned user
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->get('assigned_to'));
        }

        // Filter by user (for user's own tickets)
        if ($request->has('user_id')) {
            $query->where('user_id', $request->get('user_id'));
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $tickets = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    /**
     * Store a newly created support ticket.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'category' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'attachments' => 'nullable|array',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['ticket_number'] = SupportTicket::generateTicketNumber();
        $validated['status'] = 'open';
        $validated['priority'] = $validated['priority'] ?? 'medium';

        $ticket = SupportTicket::create($validated);
        $ticket->load(['user']);

        // Persist snapshot to public storage
        $this->saveTicketSnapshot($ticket);

        return response()->json([
            'success' => true,
            'message' => 'Support ticket created successfully.',
            'data' => $ticket,
        ], 201);
    }

    /**
     * Display the specified support ticket.
     */
    public function show(SupportTicket $ticket): JsonResponse
    {
        $ticket->load(['user', 'assignedTo', 'replies.user']);

        return response()->json([
            'success' => true,
            'data' => $ticket,
        ]);
    }

    /**
     * Update the specified support ticket.
     */
    public function update(Request $request, SupportTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'subject' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'priority' => 'sometimes|required|in:low,medium,high,urgent',
            'status' => 'sometimes|required|in:open,in_progress,pending,resolved,closed',
            'category' => 'nullable|string|max:100',
            'assigned_to' => 'nullable|exists:users,id',
            'tags' => 'nullable|array',
            'attachments' => 'nullable|array',
        ]);

        // Update resolved_at or closed_at based on status
        if (isset($validated['status'])) {
            if ($validated['status'] === 'resolved' && !$ticket->resolved_at) {
                $validated['resolved_at'] = now();
            } elseif ($validated['status'] === 'closed' && !$ticket->closed_at) {
                $validated['closed_at'] = now();
            } elseif (in_array($validated['status'], ['open', 'in_progress', 'pending'])) {
                $validated['resolved_at'] = null;
                $validated['closed_at'] = null;
            }
        }

        $ticket->update($validated);

        // Persist snapshot to public storage
        $this->saveTicketSnapshot($ticket);

        return response()->json([
            'success' => true,
            'message' => 'Support ticket updated successfully.',
            'data' => $ticket,
        ]);
    }

    /**
     * Remove the specified support ticket.
     */
    public function destroy(SupportTicket $ticket): JsonResponse
    {
        $user = Auth::user();

        // Allow admins to delete any ticket
        if (!$user->isAdmin()) {
            // Normal users can delete ONLY their own closed/resolved tickets
            if ($ticket->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to delete this ticket.',
                ], 403);
            }
            if (!$ticket->isClosed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only closed tickets can be deleted.',
                ], 403);
            }
        }

        // Optionally delete snapshot file
        try {
            Storage::disk('public')->delete('support_tickets/' . $ticket->id . '.json');
        } catch (\Throwable $e) {}

        $ticket->delete();

        return response()->json([
            'success' => true,
            'message' => 'Support ticket deleted successfully.',
        ]);
    }

    /**
     * Assign ticket to admin.
     */
    public function assign(Request $request, SupportTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $ticket->update([
            'assigned_to' => $validated['assigned_to'],
            'status' => 'in_progress',
        ]);

        // Persist snapshot to public storage
        $this->saveTicketSnapshot($ticket);

        return response()->json([
            'success' => true,
            'message' => 'Ticket assigned successfully.',
            'data' => $ticket->load('assignedTo'),
        ]);
    }

    /**
     * Resolve ticket.
     */
    public function resolve(SupportTicket $ticket): JsonResponse
    {
        $ticket->markAsResolved();

        // Persist snapshot to public storage
        $this->saveTicketSnapshot($ticket);

        return response()->json([
            'success' => true,
            'message' => 'Ticket resolved successfully.',
            'data' => $ticket,
        ]);
    }

    /**
     * Close ticket.
     */
    public function close(SupportTicket $ticket): JsonResponse
    {
        $ticket->markAsClosed();

        // Persist snapshot to public storage
        $this->saveTicketSnapshot($ticket);

        return response()->json([
            'success' => true,
            'message' => 'Ticket closed successfully.',
            'data' => $ticket,
        ]);
    }

    /**
     * Reopen ticket.
     */
    public function reopen(SupportTicket $ticket): JsonResponse
    {
        $ticket->reopen();

        // Persist snapshot to public storage
        $this->saveTicketSnapshot($ticket);

        return response()->json([
            'success' => true,
            'message' => 'Ticket reopened successfully.',
            'data' => $ticket,
        ]);
    }

    /**
     * Add reply to ticket.
     */
    public function addReply(Request $request, SupportTicket $ticket): JsonResponse
    {
        // Disallow replies on closed/resolved tickets
        if ($ticket->isClosed()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot add a reply to a closed ticket.',
            ], 403);
        }

        $validated = $request->validate([
            'message' => 'required|string',
            'attachments' => 'nullable|array',
        ]);

        $validated['support_ticket_id'] = $ticket->id;
        $validated['user_id'] = Auth::id();
        $validated['is_admin_reply'] = Auth::user()->isAdmin();

        $reply = SupportTicketReply::create($validated);

        // Update ticket status if user replied
        if (!$validated['is_admin_reply']) {
            $ticket->update(['status' => 'pending']);
        }

        $reply->load('user');

        // Persist snapshot to public storage
        $this->saveTicketSnapshot($ticket);

        return response()->json([
            'success' => true,
            'message' => 'Reply added successfully.',
            'data' => $reply,
        ], 201);
    }

    /**
     * Get ticket replies.
     */
    public function replies(SupportTicket $ticket): JsonResponse
    {
        $replies = $ticket->replies()
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $replies,
        ]);
    }

    /**
     * Get support ticket statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_tickets' => SupportTicket::count(),
            'open_tickets' => SupportTicket::open()->count(),
            'closed_tickets' => SupportTicket::closed()->count(),
            'resolved_tickets' => SupportTicket::where('status', 'resolved')->count(),
            'priority_breakdown' => [
                'low' => SupportTicket::byPriority('low')->count(),
                'medium' => SupportTicket::byPriority('medium')->count(),
                'high' => SupportTicket::byPriority('high')->count(),
                'urgent' => SupportTicket::byPriority('urgent')->count(),
            ],
            'status_breakdown' => [
                'open' => SupportTicket::byStatus('open')->count(),
                'in_progress' => SupportTicket::byStatus('in_progress')->count(),
                'pending' => SupportTicket::byStatus('pending')->count(),
                'resolved' => SupportTicket::byStatus('resolved')->count(),
                'closed' => SupportTicket::byStatus('closed')->count(),
            ],
            'average_resolution_time' => $this->calculateAverageResolutionTime(),
            'tickets_by_month' => SupportTicket::selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count')
                ->where('created_at', '>=', now()->subMonths(12))
                ->groupBy('year', 'month')
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Calculate average resolution time.
     */
    private function calculateAverageResolutionTime(): ?float
    {
        $resolvedTickets = SupportTicket::where('status', 'resolved')
            ->whereNotNull('resolved_at')
            ->get();

        if ($resolvedTickets->isEmpty()) {
            return null;
        }

        $totalHours = $resolvedTickets->sum(function ($ticket) {
            return $ticket->created_at->diffInHours($ticket->resolved_at);
        });

        return round($totalHours / $resolvedTickets->count(), 2);
    }

    /**
     * Save current ticket snapshot (with relations) to public storage as JSON.
     */
    private function saveTicketSnapshot(SupportTicket $ticket): void
    {
        try {
            $ticket->load(['user', 'assignedTo', 'replies.user']);
            $payload = $ticket->toArray();
            Storage::disk('public')->put(
                'support_tickets/' . $ticket->id . '.json',
                json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            );
        } catch (\Throwable $e) {
            // Silently ignore snapshot failures to avoid impacting API behavior
        }
    }
}
