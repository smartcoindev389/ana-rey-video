<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PaymentTransactionController extends Controller
{
    /**
     * Display a listing of payment transactions.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PaymentTransaction::with(['user', 'subscription.plan']);

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhere('payment_gateway', 'like', "%{$search}%")
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

        // Filter by payment gateway
        if ($request->has('gateway')) {
            $query->where('payment_gateway', $request->get('gateway'));
        }

        // Filter by user
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

        // Filter by amount range
        if ($request->has('amount_min')) {
            $query->where('amount', '>=', $request->get('amount_min'));
        }
        if ($request->has('amount_max')) {
            $query->where('amount', '<=', $request->get('amount_max'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $transactions = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    /**
     * Display the specified payment transaction.
     */
    public function show(PaymentTransaction $transaction): JsonResponse
    {
        $transaction->load(['user', 'subscription.plan']);

        return response()->json([
            'success' => true,
            'data' => $transaction,
        ]);
    }

    /**
     * Update the specified payment transaction.
     */
    public function update(Request $request, PaymentTransaction $transaction): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|required|in:pending,completed,failed,refunded',
            'notes' => 'nullable|string',
            'payment_details' => 'nullable|array',
            'gateway_response' => 'nullable|array',
        ]);

        $transaction->update($validated);

        // If status changed to completed, update paid_at
        if (isset($validated['status']) && $validated['status'] === 'completed' && !$transaction->paid_at) {
            $transaction->update(['paid_at' => now()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully.',
            'data' => $transaction,
        ]);
    }

    /**
     * Mark transaction as completed.
     */
    public function markCompleted(PaymentTransaction $transaction): JsonResponse
    {
        if ($transaction->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Transaction is already completed.',
            ], 422);
        }

        $transaction->markAsCompleted();

        return response()->json([
            'success' => true,
            'message' => 'Transaction marked as completed.',
            'data' => $transaction,
        ]);
    }

    /**
     * Mark transaction as failed.
     */
    public function markFailed(PaymentTransaction $transaction): JsonResponse
    {
        if ($transaction->status === 'failed') {
            return response()->json([
                'success' => false,
                'message' => 'Transaction is already marked as failed.',
            ], 422);
        }

        $transaction->markAsFailed();

        return response()->json([
            'success' => true,
            'message' => 'Transaction marked as failed.',
            'data' => $transaction,
        ]);
    }

    /**
     * Refund transaction.
     */
    public function refund(PaymentTransaction $transaction): JsonResponse
    {
        if ($transaction->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Only completed transactions can be refunded.',
            ], 422);
        }

        $transaction->update([
            'status' => 'refunded',
            'notes' => $transaction->notes . "\n[REFUNDED] " . now()->toDateTimeString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transaction refunded successfully.',
            'data' => $transaction,
        ]);
    }

    /**
     * Get payment statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_transactions' => PaymentTransaction::count(),
            'completed_transactions' => PaymentTransaction::completed()->count(),
            'pending_transactions' => PaymentTransaction::pending()->count(),
            'failed_transactions' => PaymentTransaction::where('status', 'failed')->count(),
            'refunded_transactions' => PaymentTransaction::where('status', 'refunded')->count(),
            'total_revenue' => PaymentTransaction::completed()->sum('amount') ?? 0,
            'pending_revenue' => PaymentTransaction::pending()->sum('amount') ?? 0,
            'refunded_amount' => PaymentTransaction::where('status', 'refunded')->sum('amount') ?? 0,
            'average_transaction_value' => PaymentTransaction::completed()->avg('amount') ?? 0,
        ];

        // Monthly revenue for the last 12 months
        $monthlyRevenue = PaymentTransaction::completed()
            ->select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month'),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        // Payment gateway breakdown
        $gatewayBreakdown = PaymentTransaction::completed()
            ->select(
                'payment_gateway',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as revenue')
            )
            ->groupBy('payment_gateway')
            ->get();

        $stats['monthly_revenue'] = $monthlyRevenue;
        $stats['gateway_breakdown'] = $gatewayBreakdown;

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Export transactions to CSV.
     */
    public function export(Request $request): JsonResponse
    {
        $query = PaymentTransaction::with(['user', 'subscription.plan']);

        // Apply same filters as index method
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhere('payment_gateway', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        $transactions = $query->orderBy('created_at', 'desc')->get();

        // Generate CSV data
        $csvData = [];
        $csvData[] = [
            'ID',
            'Transaction ID',
            'User',
            'Email',
            'Amount',
            'Currency',
            'Status',
            'Payment Gateway',
            'Payment Method',
            'Created At',
            'Paid At',
            'Notes'
        ];

        foreach ($transactions as $transaction) {
            $csvData[] = [
                $transaction->id,
                $transaction->transaction_id,
                $transaction->user->name ?? 'N/A',
                $transaction->user->email ?? 'N/A',
                $transaction->amount,
                $transaction->currency,
                $transaction->status,
                $transaction->payment_gateway,
                $transaction->payment_method,
                $transaction->created_at->format('Y-m-d H:i:s'),
                $transaction->paid_at ? $transaction->paid_at->format('Y-m-d H:i:s') : 'N/A',
                $transaction->notes ?? ''
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $csvData,
            'message' => 'Export data generated successfully.',
        ]);
    }
}
