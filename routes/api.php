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

// Public series and videos (with access control)
Route::get('/series', [SeriesController::class, 'index']);
Route::get('/series/{series}', [SeriesController::class, 'show']);
Route::get('/videos', [VideoController::class, 'index']);
Route::get('/videos/{video}', [VideoController::class, 'show']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
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
        Route::post('/video/{video}/rate', [UserProgressController::class, 'rateVideo']);
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
    });

    // Public read access to categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);

    // Series (read access for authenticated users)
    Route::get('/series/{series}/videos', [VideoController::class, 'seriesVideos']);
    Route::get('/series/{series}/recommended', [SeriesController::class, 'recommended']);
    Route::get('/series/{series}/accessible', [SeriesController::class, 'isAccessibleTo']);

    // Videos (additional authenticated routes)
    Route::get('/videos/{video}/stream', [VideoController::class, 'stream']);
    Route::get('/videos/{video}/accessible', [VideoController::class, 'isAccessibleTo']);
    
});

