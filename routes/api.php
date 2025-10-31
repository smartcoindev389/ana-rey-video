<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\SeriesController;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\UserProgressController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use App\Http\Controllers\Api\PaymentTransactionController;
use App\Http\Controllers\Api\StripeController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\SupportTicketController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\HeroBackgroundController;
use App\Http\Controllers\Api\TestimonialController;

// Preflight CORS for all API routes (avoid auth/csrf on OPTIONS)
Route::options('/{any}', function () {
    return response()->noContent();
})->where('any', '.*');

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public content routes
Route::get('/categories/public', [CategoryController::class, 'public']);
Route::get('/series/featured', [SeriesController::class, 'featured']);
Route::get('/series/popular', [SeriesController::class, 'popular']);
Route::get('/series/new-releases', [SeriesController::class, 'newReleases']);

// Public FAQ routes
Route::get('/faqs', [FaqController::class, 'index']);
Route::get('/faqs/categories', [FaqController::class, 'categories']);

// Public Settings routes
Route::get('/settings/public', [SettingsController::class, 'getPublicSettings']);

// Public Testimonial routes
Route::get('/testimonials/public', [TestimonialController::class, 'public']);

// Public series and videos (with access control)
Route::get('/series', [SeriesController::class, 'index']);
Route::get('/series/{series}', [SeriesController::class, 'show']);
Route::get('/videos', [VideoController::class, 'index']);
Route::get('/videos/{video}', [VideoController::class, 'show']);
Route::get('/videos/{video}/stream', [VideoController::class, 'stream']);

// Video Comments (public access to read, authenticated to write)
Route::get('/videos/{video}/comments', [\App\Http\Controllers\Api\VideoCommentController::class, 'index']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Payments (Stripe)
    Route::post('/payments/checkout', [StripeController::class, 'createCheckoutSession']);
    // Auth routes
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/subscription', [AuthController::class, 'updateSubscription']);

    // User Progress
    Route::prefix('progress')->group(function () {
        Route::get('/', [UserProgressController::class, 'index']);
        Route::get('/stats', [UserProgressController::class, 'getStats']);
        Route::get('/continue-watching', [UserProgressController::class, 'continueWatching']);
        Route::get('/favorites', [UserProgressController::class, 'favorites']);
        Route::get('/completed', [UserProgressController::class, 'completed']);
        Route::get('/video/{video}', [UserProgressController::class, 'getVideoProgress']);
        Route::get('/series/{series}', [UserProgressController::class, 'getSeriesProgress']);
        Route::put('/video/{video}', [UserProgressController::class, 'updateVideoProgress']);
        Route::post('/video/{video}/favorite', [UserProgressController::class, 'toggleFavorite']);
        Route::post('/video/{video}/like', [UserProgressController::class, 'toggleLike']);
        Route::post('/video/{video}/dislike', [UserProgressController::class, 'toggleDislike']);
        Route::post('/video/{video}/rate', [UserProgressController::class, 'rateVideo']);
        Route::get('/favorites/list', [UserProgressController::class, 'getFavorites']);
    });

    // Admin routes
    Route::middleware('admin')->group(function () {
        // User Management
        Route::apiResource('users', UserController::class);
        Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::post('/users/{user}/upgrade', [UserController::class, 'upgradeSubscription']);
        Route::get('/users-statistics', [UserController::class, 'statistics']);

        // Categories (Admin CRUD) - Use ID-based routing for admin operations
        Route::post('/admin/categories', [CategoryController::class, 'store']);
        Route::put('/admin/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/admin/categories/{id}', [CategoryController::class, 'destroy']);

        // Series (Admin CRUD) - Use ID-based routing for admin operations
        Route::post('/admin/series', [SeriesController::class, 'store']);
        Route::put('/admin/series/{id}', [SeriesController::class, 'update']);
        Route::delete('/admin/series/{id}', [SeriesController::class, 'destroy']);

        // Videos (Admin CRUD) - Use ID-based routing for admin operations
        Route::post('/admin/videos', [VideoController::class, 'store']);
        Route::put('/admin/videos/{id}', [VideoController::class, 'update']);
        Route::delete('/admin/videos/{id}', [VideoController::class, 'destroy']);
        Route::post('/admin/videos/{id}/reencode', [VideoController::class, 'reencode']);
        Route::get('/admin/videos/{id}/codec-info', [VideoController::class, 'codecInfo']);
        
        // Admin read access to series and videos (for admin panel)
        Route::get('/admin/series', [SeriesController::class, 'index']);
        Route::get('/admin/series/{series}', [SeriesController::class, 'show']);
        Route::get('/admin/videos', [VideoController::class, 'index']);
        Route::get('/admin/videos/{video}', [VideoController::class, 'show']);
        Route::get('/admin/categories', [CategoryController::class, 'index']);

        // FAQ Management (Admin CRUD)
        Route::post('/admin/faqs', [FaqController::class, 'store']);
        Route::put('/admin/faqs/{faq}', [FaqController::class, 'update']);
        Route::delete('/admin/faqs/{faq}', [FaqController::class, 'destroy']);
        Route::get('/admin/faqs', [FaqController::class, 'adminIndex']);

        // Settings Management (Admin CRUD)
        Route::get('/admin/settings', [SettingsController::class, 'index']);
        Route::get('/admin/settings/{group}', [SettingsController::class, 'getByGroup']);
        Route::put('/admin/settings', [SettingsController::class, 'bulkUpdate']);

        // Subscription Plans Management (Admin CRUD)
        Route::apiResource('subscription-plans', SubscriptionPlanController::class);
        Route::post('/subscription-plans/{plan}/toggle-status', [SubscriptionPlanController::class, 'toggleStatus']);
        Route::get('/subscription-plans/{plan}/statistics', [SubscriptionPlanController::class, 'statistics']);
        Route::get('/subscription-plans/public', [SubscriptionPlanController::class, 'public']);

        // Payment Transactions Management (Admin CRUD)
        Route::apiResource('payment-transactions', PaymentTransactionController::class);
        Route::post('/payment-transactions/{transaction}/mark-completed', [PaymentTransactionController::class, 'markCompleted']);
        Route::post('/payment-transactions/{transaction}/mark-failed', [PaymentTransactionController::class, 'markFailed']);
        Route::post('/payment-transactions/{transaction}/refund', [PaymentTransactionController::class, 'refund']);
        Route::get('/payment-transactions/statistics', [PaymentTransactionController::class, 'statistics']);
        Route::get('/payment-transactions/export', [PaymentTransactionController::class, 'export']);

        // Analytics and Reports (Admin only)
        Route::prefix('analytics')->group(function () {
            Route::get('/overview', [AnalyticsController::class, 'overview']);
            Route::get('/user-growth', [AnalyticsController::class, 'userGrowth']);
            Route::get('/revenue', [AnalyticsController::class, 'revenue']);
            Route::get('/top-videos', [AnalyticsController::class, 'topVideos']);
            Route::get('/subscription-stats', [AnalyticsController::class, 'subscriptionStats']);
            Route::get('/content-analytics', [AnalyticsController::class, 'contentAnalytics']);
            Route::get('/engagement-analytics', [AnalyticsController::class, 'engagementAnalytics']);
        });

        // Coupons Management (Admin CRUD)
        Route::apiResource('coupons', CouponController::class);
        Route::post('/coupons/{coupon}/toggle-status', [CouponController::class, 'toggleStatus']);
        Route::post('/coupons/validate', [CouponController::class, 'validate']);
        Route::get('/coupons/{coupon}/statistics', [CouponController::class, 'statistics']);
        Route::get('/coupons/{coupon}/usage', [CouponController::class, 'usage']);
        Route::get('/coupons-statistics', [CouponController::class, 'overallStatistics']);

        // Support Tickets Management (Admin CRUD)
        Route::apiResource('support-tickets', SupportTicketController::class);
        Route::post('/support-tickets/{ticket}/assign', [SupportTicketController::class, 'assign']);
        Route::post('/support-tickets/{ticket}/resolve', [SupportTicketController::class, 'resolve']);
        Route::post('/support-tickets/{ticket}/close', [SupportTicketController::class, 'close']);
        Route::post('/support-tickets/{ticket}/reopen', [SupportTicketController::class, 'reopen']);
        Route::post('/support-tickets/{ticket}/add-reply', [SupportTicketController::class, 'addReply']);
        Route::get('/support-tickets/{ticket}/replies', [SupportTicketController::class, 'replies']);
        Route::get('/support-tickets-statistics', [SupportTicketController::class, 'statistics']);

        // Feedback Management (Admin CRUD)
        Route::apiResource('feedback', FeedbackController::class);
        Route::post('/feedback/{feedback}/assign', [FeedbackController::class, 'assign']);
        Route::post('/feedback/{feedback}/resolve', [FeedbackController::class, 'resolve']);
        Route::post('/feedback/{feedback}/reject', [FeedbackController::class, 'reject']);
        Route::get('/feedback/by-type/{type}', [FeedbackController::class, 'byType']);
        Route::get('/feedback/high-priority', [FeedbackController::class, 'highPriority']);
        Route::get('/feedback-statistics', [FeedbackController::class, 'statistics']);

        // Hero Background Management (Admin CRUD)
        Route::apiResource('/admin/hero-backgrounds', HeroBackgroundController::class);
        Route::post('/admin/hero-backgrounds/{background}/toggle-status', [HeroBackgroundController::class, 'toggleStatus']);
        Route::get('/admin/hero-backgrounds/public', [HeroBackgroundController::class, 'public']);

        // Testimonial Management (Admin CRUD)
        Route::get('/admin/testimonials', [TestimonialController::class, 'index']);
        Route::post('/admin/testimonials', [TestimonialController::class, 'store']);
        Route::get('/admin/testimonials/{id}', [TestimonialController::class, 'show']);
        Route::put('/admin/testimonials/{id}', [TestimonialController::class, 'update']);
        Route::delete('/admin/testimonials/{id}', [TestimonialController::class, 'destroy']);
        Route::post('/admin/testimonials/{id}/toggle-approval', [TestimonialController::class, 'toggleApproval']);
        Route::post('/admin/testimonials/{id}/toggle-featured', [TestimonialController::class, 'toggleFeatured']);
    });

    // Public read access to categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);

    // Public access to hero backgrounds
    Route::get('/hero-backgrounds/public', [HeroBackgroundController::class, 'public']);

    // Series (read access for authenticated users)
    Route::get('/series/{series}/videos', [VideoController::class, 'seriesVideos']);
    Route::get('/series/{series}/recommended', [SeriesController::class, 'recommended']);
    Route::get('/series/{series}/accessible', [SeriesController::class, 'isAccessibleTo']);

    // Videos (additional authenticated routes)
    Route::get('/videos/{video}/accessible', [VideoController::class, 'isAccessibleTo']);

    // Video Comments (authenticated)
    Route::post('/videos/{video}/comments', [\App\Http\Controllers\Api\VideoCommentController::class, 'store']);
    Route::put('/comments/{comment}', [\App\Http\Controllers\Api\VideoCommentController::class, 'update']);
    Route::delete('/comments/{comment}', [\App\Http\Controllers\Api\VideoCommentController::class, 'destroy']);
    Route::post('/comments/{comment}/like', [\App\Http\Controllers\Api\VideoCommentController::class, 'toggleLike']);

    // User support and feedback routes
    Route::prefix('support-tickets')->group(function () {
        Route::get('/', [SupportTicketController::class, 'index']);
        Route::post('/', [SupportTicketController::class, 'store']);
        Route::get('/{ticket}', [SupportTicketController::class, 'show']);
        Route::post('/{ticket}/add-reply', [SupportTicketController::class, 'addReply']);
        Route::get('/{ticket}/replies', [SupportTicketController::class, 'replies']);
    });

    Route::prefix('feedback')->group(function () {
        Route::get('/', [FeedbackController::class, 'index']);
        Route::post('/', [FeedbackController::class, 'store']);
        Route::get('/{feedback}', [FeedbackController::class, 'show']);
    });

    // Coupon validation (public)
    Route::post('/coupons/validate', [CouponController::class, 'validate']);
    Route::get('/subscription-plans/public', [SubscriptionPlanController::class, 'public']);
    
    // Media upload routes (admin only)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/media/images', [\App\Http\Controllers\Api\MediaController::class, 'uploadImages']);
        Route::post('/media/videos', [\App\Http\Controllers\Api\MediaController::class, 'uploadVideos']);
        Route::get('/media/images', [\App\Http\Controllers\Api\MediaController::class, 'getImages']);
        Route::get('/media/videos', [\App\Http\Controllers\Api\MediaController::class, 'getVideos']);
        Route::delete('/media/files', [\App\Http\Controllers\Api\MediaController::class, 'deleteFile']);
    });
    
});

// Stripe webhook (public)
Route::post('/payments/stripe/webhook', [StripeController::class, 'webhook']);

