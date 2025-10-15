<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by subscription type
        if ($request->has('subscription_type')) {
            $query->where('subscription_type', $request->get('subscription_type'));
        }

        // Filter by role
        if ($request->has('role')) {
            $query->where('role', $request->get('role'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Include user statistics
        if ($request->boolean('with_stats')) {
            $query->withCount(['progress', 'transactions']);
        }

        $users = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'subscription_type' => 'nullable|in:freemium,basic,premium',
            'role' => 'nullable|in:user,admin',
            'bio' => 'nullable|string',
            'avatar' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'social_links' => 'nullable|array',
            'subscription_expires_at' => 'nullable|date|after:now',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        
        // Set defaults
        if (!isset($validated['subscription_type'])) {
            $validated['subscription_type'] = 'freemium';
        }
        
        if (!isset($validated['role'])) {
            $validated['role'] = 'user';
        }

        // Set subscription dates for paid subscriptions
        if (in_array($validated['subscription_type'], ['basic', 'premium'])) {
            $validated['subscription_started_at'] = now();
            if (!isset($validated['subscription_expires_at'])) {
                $validated['subscription_expires_at'] = now()->addDays(30);
            }
        }

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully.',
            'data' => $user,
        ], 201);
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        // Load relationships
        $user->load([
            'subscriptions' => function ($q) {
                $q->latest()->limit(5);
            },
            'transactions' => function ($q) {
                $q->latest()->limit(10);
            }
        ]);

        // Get user statistics
        $stats = [
            'total_spent' => $user->totalSpent(),
            'active_subscription' => $user->activeSubscription(),
            'subscription_active' => $user->isSubscriptionActive(),
            'days_remaining' => $user->daysRemaining(),
            'progress_count' => $user->progress()->count(),
            'completed_videos' => $user->progress()->where('completed', true)->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'stats' => $stats,
            ],
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8',
            'subscription_type' => 'nullable|in:freemium,basic,premium',
            'role' => 'nullable|in:user,admin',
            'bio' => 'nullable|string',
            'avatar' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'social_links' => 'nullable|array',
            'subscription_expires_at' => 'nullable|date',
        ]);

        // Hash password if provided
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        // Update subscription dates if subscription type changed
        if (isset($validated['subscription_type']) && $validated['subscription_type'] !== $user->subscription_type) {
            if (in_array($validated['subscription_type'], ['basic', 'premium'])) {
                $validated['subscription_started_at'] = now();
                if (!isset($validated['subscription_expires_at'])) {
                    $validated['subscription_expires_at'] = now()->addDays(30);
                }
            }
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'data' => $user,
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent deleting own account
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully.',
        ]);
    }

    /**
     * Suspend or activate a user.
     */
    public function toggleStatus(Request $request, User $user): JsonResponse
    {
        // Prevent suspending own account
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot suspend your own account.',
            ], 422);
        }

        // Toggle subscription status by expiring the subscription
        if ($user->subscription_expires_at && $user->subscription_expires_at->isFuture()) {
            // Suspend: expire now
            $user->subscription_expires_at = now()->subDay();
            $message = 'User suspended successfully.';
        } else {
            // Activate: extend subscription
            if ($user->subscription_type !== 'freemium') {
                $user->subscription_expires_at = now()->addDays(30);
                $message = 'User activated successfully.';
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot suspend/activate freemium users.',
                ], 422);
            }
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $user,
        ]);
    }

    /**
     * Upgrade user subscription.
     */
    public function upgradeSubscription(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'subscription_type' => 'required|in:basic,premium',
            'duration_days' => 'nullable|integer|min:1|max:365',
        ]);

        $durationDays = $validated['duration_days'] ?? 30;

        $user->subscription_type = $validated['subscription_type'];
        $user->subscription_started_at = now();
        
        // If user already has active subscription, extend it
        if ($user->subscription_expires_at && $user->subscription_expires_at->isFuture()) {
            $user->subscription_expires_at = $user->subscription_expires_at->addDays($durationDays);
        } else {
            $user->subscription_expires_at = now()->addDays($durationDays);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Subscription upgraded successfully.',
            'data' => $user,
        ]);
    }

    /**
     * Get user statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::where('subscription_expires_at', '>', now())
                ->orWhere('subscription_type', 'freemium')
                ->count(),
            'premium_users' => User::where('subscription_type', 'premium')->count(),
            'basic_users' => User::where('subscription_type', 'basic')->count(),
            'freemium_users' => User::where('subscription_type', 'freemium')->count(),
            'suspended_users' => User::where('subscription_expires_at', '<', now())
                ->where('subscription_type', '!=', 'freemium')
                ->count(),
            'total_revenue' => User::whereHas('transactions', function ($q) {
                $q->where('status', 'completed');
            })->get()->sum(function ($user) {
                return $user->totalSpent();
            }),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}

