<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class CouponController extends Controller
{
    /**
     * Display a listing of coupons.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Coupon::withCount('usages');

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            switch ($request->get('status')) {
                case 'active':
                    $query->active();
                    break;
                case 'expired':
                    $query->expired();
                    break;
                case 'valid':
                    $query->valid();
                    break;
                case 'inactive':
                    $query->where('is_active', false);
                    break;
            }
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $coupons = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $coupons,
        ]);
    }

    /**
     * Store a newly created coupon.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed_amount,free_trial',
            'value' => 'required|numeric|min:0',
            'minimum_amount' => 'nullable|numeric|min:0',
            'maximum_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'is_active' => 'nullable|boolean',
            'applicable_plans' => 'nullable|array',
            'applicable_plans.*' => 'string|in:freemium,basic,premium',
            'first_time_only' => 'nullable|boolean',
        ]);

        // Set default values
        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['first_time_only'] = $validated['first_time_only'] ?? false;
        $validated['used_count'] = 0;

        $coupon = Coupon::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Coupon created successfully.',
            'data' => $coupon,
        ], 201);
    }

    /**
     * Display the specified coupon.
     */
    public function show(Coupon $coupon): JsonResponse
    {
        $coupon->load(['usages.user']);

        return response()->json([
            'success' => true,
            'data' => $coupon,
        ]);
    }

    /**
     * Update the specified coupon.
     */
    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('coupons', 'code')->ignore($coupon->id),
            ],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed_amount,free_trial',
            'value' => 'required|numeric|min:0',
            'minimum_amount' => 'nullable|numeric|min:0',
            'maximum_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'is_active' => 'nullable|boolean',
            'applicable_plans' => 'nullable|array',
            'applicable_plans.*' => 'string|in:freemium,basic,premium',
            'first_time_only' => 'nullable|boolean',
        ]);

        $coupon->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Coupon updated successfully.',
            'data' => $coupon,
        ]);
    }

    /**
     * Remove the specified coupon.
     */
    public function destroy(Coupon $coupon): JsonResponse
    {
        // Check if coupon has been used
        if ($coupon->usages()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete coupon that has been used.',
            ], 422);
        }

        $coupon->delete();

        return response()->json([
            'success' => true,
            'message' => 'Coupon deleted successfully.',
        ]);
    }

    /**
     * Toggle coupon status (active/inactive).
     */
    public function toggleStatus(Coupon $coupon): JsonResponse
    {
        $coupon->update(['is_active' => !$coupon->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Coupon status updated successfully.',
            'data' => $coupon,
        ]);
    }

    /**
     * Validate coupon code.
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'plan' => 'nullable|string|in:freemium,basic,premium',
        ]);

        $coupon = Coupon::where('code', $validated['code'])->first();

        if (!$coupon) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid coupon code.',
            ], 404);
        }

        if (!$coupon->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Coupon is not valid.',
            ], 422);
        }

        // Check if plan is applicable
        if ($validated['plan'] && !$coupon->appliesToPlan($validated['plan'])) {
            return response()->json([
                'success' => false,
                'message' => 'Coupon is not applicable to this plan.',
            ], 422);
        }

        $discount = $coupon->calculateDiscount($validated['amount']);

        return response()->json([
            'success' => true,
            'data' => [
                'coupon' => $coupon,
                'discount_amount' => $discount,
                'final_amount' => $validated['amount'] - $discount,
            ],
        ]);
    }

    /**
     * Get coupon usage statistics.
     */
    public function statistics(Coupon $coupon): JsonResponse
    {
        $stats = [
            'total_usage' => $coupon->usages()->count(),
            'total_discount_given' => $coupon->usages()->sum('discount_amount'),
            'usage_by_month' => $coupon->usages()
                ->selectRaw('YEAR(used_at) as year, MONTH(used_at) as month, COUNT(*) as count, SUM(discount_amount) as total_discount')
                ->whereNotNull('used_at')
                ->groupBy('year', 'month')
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->get(),
            'recent_usage' => $coupon->usages()
                ->with('user')
                ->latest('used_at')
                ->limit(10)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get all coupon usage records.
     */
    public function usage(Request $request, Coupon $coupon): JsonResponse
    {
        $query = $coupon->usages()->with('user');

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('used_at', '>=', $request->get('date_from'));
        }
        if ($request->has('date_to')) {
            $query->whereDate('used_at', '<=', $request->get('date_to'));
        }

        $usage = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $usage,
        ]);
    }

    /**
     * Get overall coupon statistics.
     */
    public function overallStatistics(): JsonResponse
    {
        $stats = [
            'total_coupons' => Coupon::count(),
            'active_coupons' => Coupon::active()->count(),
            'expired_coupons' => Coupon::expired()->count(),
            'total_usage' => CouponUsage::count(),
            'total_discount_given' => CouponUsage::sum('discount_amount'),
            'most_used_coupons' => Coupon::withCount('usages')
                ->orderBy('usages_count', 'desc')
                ->limit(5)
                ->get(),
            'coupon_types_breakdown' => Coupon::selectRaw('type, COUNT(*) as count, SUM(used_count) as total_usage')
                ->groupBy('type')
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
