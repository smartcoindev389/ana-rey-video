<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class FeedbackController extends Controller
{
    /**
     * Display a listing of feedback.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Feedback::with(['user', 'assignedTo', 'video']);

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
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

        // Filter by user (for user's own feedback)
        if ($request->has('user_id')) {
            $query->where('user_id', $request->get('user_id'));
        }

        // Filter by video
        if ($request->has('video_id')) {
            $query->where('video_id', $request->get('video_id'));
        }

        // Filter by rating
        if ($request->has('rating')) {
            $query->where('rating', $request->get('rating'));
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

        $feedback = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $feedback,
        ]);
    }

    /**
     * Store a newly created feedback.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id' => 'nullable|exists:videos,id',
            'type' => 'required|in:bug_report,feature_request,general_feedback,complaint',
            'description' => 'required|string',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'category' => 'nullable|string|max:100',
            'rating' => 'nullable|integer|min:1|max:5',
            'metadata' => 'nullable|array',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['status'] = 'new';
        $validated['priority'] = $validated['priority'] ?? 'medium';

        // Check if user has already submitted feedback for this video
        if (!empty($validated['video_id'])) {
            $existingFeedback = Feedback::where('user_id', Auth::id())
                ->where('video_id', $validated['video_id'])
                ->first();

            if ($existingFeedback) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already submitted feedback for this video. You can only submit one feedback per video.',
                ], 422);
            }
        }

        $feedback = Feedback::create($validated);
        $feedback->load(['user', 'video']);

        return response()->json([
            'success' => true,
            'message' => 'Feedback submitted successfully.',
            'data' => $feedback,
        ], 201);
    }

    /**
     * Display the specified feedback.
     */
    public function show(Feedback $feedback): JsonResponse
    {
        $feedback->load(['user', 'assignedTo', 'video']);

        return response()->json([
            'success' => true,
            'data' => $feedback,
        ]);
    }

    /**
     * Update the specified feedback.
     */
    public function update(Request $request, Feedback $feedback): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|required|in:bug_report,feature_request,general_feedback,complaint',
            'description' => 'sometimes|required|string',
            'priority' => 'sometimes|required|in:low,medium,high,urgent',
            'status' => 'sometimes|required|in:new,reviewed,in_progress,resolved,rejected',
            'category' => 'nullable|string|max:100',
            'rating' => 'nullable|integer|min:1|max:5',
            'metadata' => 'nullable|array',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        // Update resolved_at based on status
        if (isset($validated['status'])) {
            if ($validated['status'] === 'resolved' && !$feedback->resolved_at) {
                $validated['resolved_at'] = now();
            } elseif ($validated['status'] !== 'resolved') {
                $validated['resolved_at'] = null;
            }
        }

        $feedback->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Feedback updated successfully.',
            'data' => $feedback,
        ]);
    }

    /**
     * Remove the specified feedback.
     */
    public function destroy(Feedback $feedback): JsonResponse
    {
        $feedback->delete();

        return response()->json([
            'success' => true,
            'message' => 'Feedback deleted successfully.',
        ]);
    }

    /**
     * Assign feedback to admin.
     */
    public function assign(Request $request, Feedback $feedback): JsonResponse
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $feedback->update([
            'assigned_to' => $validated['assigned_to'],
            'status' => 'in_progress',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Feedback assigned successfully.',
            'data' => $feedback->load('assignedTo'),
        ]);
    }

    /**
     * Resolve feedback.
     */
    public function resolve(Feedback $feedback): JsonResponse
    {
        $feedback->markAsResolved();

        return response()->json([
            'success' => true,
            'message' => 'Feedback resolved successfully.',
            'data' => $feedback,
        ]);
    }

    /**
     * Reject feedback.
     */
    public function reject(Feedback $feedback): JsonResponse
    {
        $feedback->markAsRejected();

        return response()->json([
            'success' => true,
            'message' => 'Feedback rejected successfully.',
            'data' => $feedback,
        ]);
    }

    /**
     * Get feedback statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_feedback' => Feedback::count(),
            'new_feedback' => Feedback::new()->count(),
            'resolved_feedback' => Feedback::resolved()->count(),
            'rejected_feedback' => Feedback::where('status', 'rejected')->count(),
            'type_breakdown' => [
                'bug_report' => Feedback::byType('bug_report')->count(),
                'feature_request' => Feedback::byType('feature_request')->count(),
                'general_feedback' => Feedback::byType('general_feedback')->count(),
                'complaint' => Feedback::byType('complaint')->count(),
            ],
            'priority_breakdown' => [
                'low' => Feedback::byPriority('low')->count(),
                'medium' => Feedback::byPriority('medium')->count(),
                'high' => Feedback::byPriority('high')->count(),
                'urgent' => Feedback::byPriority('urgent')->count(),
            ],
            'status_breakdown' => [
                'new' => Feedback::byStatus('new')->count(),
                'reviewed' => Feedback::byStatus('reviewed')->count(),
                'in_progress' => Feedback::byStatus('in_progress')->count(),
                'resolved' => Feedback::byStatus('resolved')->count(),
                'rejected' => Feedback::byStatus('rejected')->count(),
            ],
            'average_rating' => (float) Feedback::whereNotNull('rating')->avg('rating') ?: 0,
            'feedback_by_month' => Feedback::selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count')
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
     * Get feedback by type.
     */
    public function byType(Request $request, string $type): JsonResponse
    {
        $query = Feedback::byType($type)->with(['user', 'assignedTo']);

        // Apply same filters as index method
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->get('priority'));
        }

        $feedback = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $feedback,
        ]);
    }

    /**
     * Get high priority feedback.
     */
    public function highPriority(): JsonResponse
    {
        $feedback = Feedback::highPriority()
            ->orWhere('priority', 'urgent')
            ->with(['user', 'assignedTo'])
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $feedback,
        ]);
    }
}
