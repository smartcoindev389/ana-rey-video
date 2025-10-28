<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Video;
use App\Models\Category;
use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Models\UserProgress;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Get overview analytics.
     */
    public function overview(): JsonResponse
    {
        try {
            $totalUsers = User::count();
            $activeSubscriptions = Subscription::where('status', 'active')
                ->where('expires_at', '>', now())
                ->count();
            
            $totalRevenue = PaymentTransaction::where('status', 'completed')->sum('amount') ?? 0;
            $totalViews = Video::sum('total_views') ?? 0;
            $totalVideos = Video::count();
            $totalCategories = Category::count();
            
            // Calculate growth percentages
            $lastMonthUsers = User::where('created_at', '>=', now()->subMonth())->count();
            $userGrowthPercentage = $totalUsers > 0 ? round(($lastMonthUsers / $totalUsers) * 100, 2) : 0;
            
            $lastMonthRevenue = PaymentTransaction::where('status', 'completed')
                ->where('created_at', '>=', now()->subMonth())
                ->sum('amount') ?? 0;
            $revenueGrowthPercentage = $totalRevenue > 0 ? round(($lastMonthRevenue / $totalRevenue) * 100, 2) : 0;

            $overview = [
                'total_users' => $totalUsers,
                'active_subscriptions' => $activeSubscriptions,
                'total_revenue' => $totalRevenue,
                'total_views' => $totalViews,
                'total_videos' => $totalVideos,
                'total_categories' => $totalCategories,
                'user_growth_percentage' => $userGrowthPercentage,
                'revenue_growth_percentage' => $revenueGrowthPercentage,
            ];

            return response()->json([
                'success' => true,
                'data' => $overview,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch overview analytics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user growth analytics.
     */
    public function userGrowth(Request $request): JsonResponse
    {
        $period = $request->get('period', 'month'); // day, week, month, year
        $months = $request->get('months', 12);

        $startDate = now()->subMonths($months)->startOfMonth();

        $userGrowth = User::select(
            DB::raw('YEAR(created_at) as year'),
            DB::raw('MONTH(created_at) as month'),
            DB::raw('COUNT(*) as total_users'),
            DB::raw('COUNT(CASE WHEN subscription_type = "freemium" THEN 1 END) as freemium_users'),
            DB::raw('COUNT(CASE WHEN subscription_type = "basic" THEN 1 END) as basic_users'),
            DB::raw('COUNT(CASE WHEN subscription_type = "premium" THEN 1 END) as premium_users')
        )
        ->where('created_at', '>=', $startDate)
        ->groupBy('year', 'month')
        ->orderBy('year', 'asc')
        ->orderBy('month', 'asc')
        ->get();

        // Calculate new users and churned users
        $growthData = [];
        $previousTotal = 0;

        foreach ($userGrowth as $data) {
            $monthName = Carbon::create($data->year, $data->month, 1)->format('M');
            $newUsers = $data->total_users - $previousTotal;
            
            // Calculate churned users (simplified - users who didn't renew)
            $churnedUsers = max(0, $previousTotal * 0.05); // 5% churn rate approximation

            $growthData[] = [
                'month' => $monthName,
                'users' => $data->total_users,
                'new_users' => max(0, $newUsers),
                'churned_users' => (int) $churnedUsers,
                'freemium_users' => $data->freemium_users,
                'basic_users' => $data->basic_users,
                'premium_users' => $data->premium_users,
            ];

            $previousTotal = $data->total_users;
        }

        return response()->json([
            'success' => true,
            'data' => $growthData,
        ]);
    }

    /**
     * Get revenue analytics.
     */
    public function revenue(Request $request): JsonResponse
    {
        $period = $request->get('period', 'month');
        $months = $request->get('months', 12);

        $startDate = now()->subMonths($months)->startOfMonth();

        $revenue = PaymentTransaction::completed()
            ->select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month'),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->where('created_at', '>=', $startDate)
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        $revenueData = [];
        foreach ($revenue as $data) {
            $monthName = Carbon::create($data->year, $data->month, 1)->format('M');
            
            $revenueData[] = [
                'month' => $monthName,
                'revenue' => (float) $data->revenue,
                'subscriptions' => $data->transaction_count,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $revenueData,
        ]);
    }

    /**
     * Get top videos analytics.
     */
    public function topVideos(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 10);

        $topVideos = Video::select('videos.*')
            ->with(['series'])
            ->leftJoin('user_progress', 'videos.id', '=', 'user_progress.video_id')
            ->selectRaw('
                videos.*,
                COALESCE(SUM(user_progress.views), 0) as total_views,
                COALESCE(AVG(user_progress.completion_rate), 0) as avg_completion_rate,
                COALESCE(AVG(user_progress.rating), 0) as avg_rating
            ')
            ->where('videos.status', 'published')
            ->groupBy('videos.id')
            ->orderBy('total_views', 'desc')
            ->limit($limit)
            ->get();

        $topVideosData = $topVideos->map(function ($video) {
            return [
                'id' => $video->id,
                'title' => $video->title,
                'series_title' => $video->series->title ?? 'N/A',
                'views' => $video->total_views,
                'completion_rate' => round($video->avg_completion_rate, 1),
                'rating' => round($video->avg_rating, 1),
                'duration' => $video->duration,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $topVideosData,
        ]);
    }

    /**
     * Get subscription statistics.
     */
    public function subscriptionStats(): JsonResponse
    {
        $stats = [
            'total_subscriptions' => Subscription::count(),
            'active_subscriptions' => Subscription::active()->count(),
            'expired_subscriptions' => Subscription::expired()->count(),
            'cancelled_subscriptions' => Subscription::where('status', 'cancelled')->count(),
            'subscription_breakdown' => [
                'freemium' => User::where('subscription_type', 'freemium')->count(),
                'basic' => User::where('subscription_type', 'basic')->count(),
                'premium' => User::where('subscription_type', 'premium')->count(),
            ],
            'monthly_recurring_revenue' => $this->calculateMonthlyRecurringRevenue(),
            'average_revenue_per_user' => $this->calculateARPU(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get content analytics.
     */
    public function contentAnalytics(): JsonResponse
    {
        $contentStats = [
            'total_categories' => Category::count(),
            'published_categories' => Category::published()->count(),
            'total_videos' => Video::count(),
            'published_videos' => Video::published()->count(),
            'active_categories' => Category::where('status', 'active')->count(),
            'average_videos_per_category' => Category::withCount('videos')->avg('videos_count'),
            'total_content_duration' => Video::sum('duration'),
        ];

        // Top performing categories
        $topCategories = Category::withCount(['videos'])
            ->orderBy('total_views', 'desc')
            ->limit(5)
            ->get();

        $contentStats['top_categories'] = $topCategories->map(function ($category) {
            return [
                'id' => $category->id,
                'name' => $category->name,
                'views' => $category->total_views ?? 0,
                'video_count' => $category->videos()->count(),
                'rating' => $category->rating ?? 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $contentStats,
        ]);
    }

    /**
     * Get engagement analytics.
     */
    public function engagementAnalytics(): JsonResponse
    {
        $engagement = [
            'average_completion_rate' => UserProgress::avg('completion_rate'),
            'total_watch_time' => UserProgress::sum(DB::raw('duration * completion_rate / 100')),
            'average_session_duration' => $this->calculateAverageSessionTime(),
            'favorite_videos_count' => UserProgress::where('is_favorite', true)->count(),
            'completion_rate_by_category' => $this->getCompletionRateByCategory(),
        ];

        return response()->json([
            'success' => true,
            'data' => $engagement,
        ]);
    }

    /**
     * Calculate average session time.
     */
    private function calculateAverageSessionTime(): string
    {
        $avgMinutes = UserProgress::avg(DB::raw('duration * completion_rate / 100')) / 60;
        $hours = floor($avgMinutes / 60);
        $minutes = floor($avgMinutes % 60);
        
        return sprintf('%02d:%02d', $hours, $minutes);
    }

    /**
     * Calculate conversion rate.
     */
    private function calculateConversionRate(): float
    {
        $totalUsers = User::count();
        $paidUsers = User::whereIn('subscription_type', ['basic', 'premium'])->count();
        
        return $totalUsers > 0 ? round(($paidUsers / $totalUsers) * 100, 2) : 0;
    }

    /**
     * Calculate churn rate.
     */
    private function calculateChurnRate(): float
    {
        $activeUsers = User::where('subscription_expires_at', '>', now())
            ->whereIn('subscription_type', ['basic', 'premium'])
            ->count();
        
        $expiredUsers = User::where('subscription_expires_at', '<', now())
            ->whereIn('subscription_type', ['basic', 'premium'])
            ->count();
        
        $totalPaidUsers = $activeUsers + $expiredUsers;
        
        return $totalPaidUsers > 0 ? round(($expiredUsers / $totalPaidUsers) * 100, 2) : 0;
    }

    /**
     * Calculate monthly recurring revenue.
     */
    private function calculateMonthlyRecurringRevenue(): float
    {
        $basicUsers = User::where('subscription_type', 'basic')
            ->where('subscription_expires_at', '>', now())
            ->count();
        
        $premiumUsers = User::where('subscription_type', 'premium')
            ->where('subscription_expires_at', '>', now())
            ->count();
        
        // Assuming basic is $9.99 and premium is $19.99
        return ($basicUsers * 9.99) + ($premiumUsers * 19.99);
    }

    /**
     * Calculate average revenue per user.
     */
    private function calculateARPU(): float
    {
        $totalRevenue = PaymentTransaction::completed()->sum('amount');
        $totalUsers = User::count();
        
        return $totalUsers > 0 ? round($totalRevenue / $totalUsers, 2) : 0;
    }

    /**
     * Get completion rate by category.
     */
    private function getCompletionRateByCategory(): array
    {
        return UserProgress::join('videos', 'user_progress.video_id', '=', 'videos.id')
            ->join('series', 'videos.series_id', '=', 'series.id')
            ->join('categories', 'series.category_id', '=', 'categories.id')
            ->select(
                'categories.name as category_name',
                DB::raw('AVG(user_progress.completion_rate) as avg_completion_rate'),
                DB::raw('COUNT(*) as total_views')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('avg_completion_rate', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category_name,
                    'completion_rate' => round($item->avg_completion_rate, 2),
                    'total_views' => $item->total_views,
                ];
            })
            ->toArray();
    }
}
