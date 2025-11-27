<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class SubscriptionPlanController extends Controller
{
    /**
     * Display a listing of subscription plans.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SubscriptionPlan::query();

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('display_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('is_active', $request->boolean('status'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'sort_order');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $plans = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $plans,
        ]);
    }

    /**
     * Store a newly created subscription plan.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:subscription_plans,name',
            'display_name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'required|integer|min:1',
            'features' => 'nullable|array',
            'max_devices' => 'nullable|integer|min:1',
            'video_quality' => 'nullable|string|in:SD,HD,FHD,4K',
            'downloadable_content' => 'nullable|boolean',
            'certificates' => 'nullable|boolean',
            'priority_support' => 'nullable|boolean',
            'ad_free' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'stripe_price_id' => 'nullable|string|max:255',
        ]);

        $plan = SubscriptionPlan::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Subscription plan created successfully.',
            'data' => $plan,
        ], 201);
    }

    /**
     * Display the specified subscription plan.
     */
    public function show(SubscriptionPlan $plan): JsonResponse
    {
        $plan->loadCount('subscriptions');

        return response()->json([
            'success' => true,
            'data' => $plan,
        ]);
    }

    /**
     * Update the specified subscription plan.
     */
    public function update(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('subscription_plans', 'name')->ignore($plan->id),
            ],
            'display_name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'required|integer|min:1',
            'features' => 'nullable|array',
            'max_devices' => 'nullable|integer|min:1',
            'video_quality' => 'nullable|string|in:SD,HD,FHD,4K',
            'downloadable_content' => 'nullable|boolean',
            'certificates' => 'nullable|boolean',
            'priority_support' => 'nullable|boolean',
            'ad_free' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'stripe_price_id' => 'nullable|string|max:255',
        ]);

        $plan->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Subscription plan updated successfully.',
            'data' => $plan,
        ]);
    }

    /**
     * Remove the specified subscription plan.
     */
    public function destroy(SubscriptionPlan $plan): JsonResponse
    {
        // Check if plan has active subscriptions
        if ($plan->subscriptions()->active()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete plan that has active subscriptions.',
            ], 422);
        }

        $plan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subscription plan deleted successfully.',
        ]);
    }

    /**
     * Toggle plan status (active/inactive).
     */
    public function toggleStatus(SubscriptionPlan $plan): JsonResponse
    {
        $plan->update(['is_active' => !$plan->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Plan status updated successfully.',
            'data' => $plan,
        ]);
    }

    /**
     * Get plan statistics.
     */
    public function statistics(SubscriptionPlan $plan): JsonResponse
    {
        $stats = [
            'total_subscriptions' => $plan->subscriptions()->count(),
            'active_subscriptions' => $plan->subscriptions()->active()->count(),
            'expired_subscriptions' => $plan->subscriptions()->expired()->count(),
            'cancelled_subscriptions' => $plan->subscriptions()->where('status', 'cancelled')->count(),
            'total_revenue' => $plan->subscriptions()
                ->whereHas('transactions', function ($q) {
                    $q->where('status', 'completed');
                })
                ->get()
                ->sum(function ($subscription) {
                    return $subscription->transactions()->completed()->sum('amount');
                }),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get all active plans for public display.
     */
    public function public(): JsonResponse
    {
        try {
        $plans = SubscriptionPlan::active()->ordered()->get();

        return response()->json([
            'success' => true,
            'data' => $plans,
        ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching public subscription plans: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subscription plans.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
