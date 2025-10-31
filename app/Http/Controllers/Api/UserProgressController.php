<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserProgress;
use App\Models\Video;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UserProgressController extends Controller
{
    /**
     * Display user's progress for all content.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = UserProgress::with(['category', 'video.category'])
            ->where('user_id', $user->id);

        // Filter by type
        if ($request->has('type')) {
            switch ($request->get('type')) {
                case 'completed':
                    $query->completed();
                    break;
                case 'in_progress':
                    $query->where('is_completed', false)->where('progress_percentage', '>', 0);
                    break;
                case 'favorites':
                    $query->favorites();
                    break;
            }
        }

        // Filter by category (backward-compat: accept series_id as category_id)
        if ($request->has('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        } elseif ($request->has('series_id')) {
            $query->where('category_id', $request->get('series_id'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'last_watched_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        $query->orderBy($sortBy, $sortOrder);

        $progress = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $progress,
        ]);
    }

    /**
     * Update video progress.
     */
    public function updateVideoProgress(Request $request, Video $video): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to video
        if (!$video->isAccessibleTo($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this video.',
            ], 403);
        }

        $validated = $request->validate([
            'time_watched' => 'required|integer|min:0',
            'video_duration' => 'required|integer|min:1',
            'progress_percentage' => 'nullable|integer|min:0|max:100',
            'is_completed' => 'nullable|boolean',
        ]);

        $timeWatched = $validated['time_watched'];
        $videoDuration = $validated['video_duration'];

        // Update progress
        $progress = UserProgress::updateVideoProgress($user, $video, $timeWatched, $videoDuration);

        return response()->json([
            'success' => true,
            'message' => 'Progress updated successfully.',
            'data' => $progress,
        ]);
    }

    /**
     * Get user's progress for a specific video.
     */
    public function getVideoProgress(Video $video): JsonResponse
    {
        $user = Auth::user();

        $progress = UserProgress::where('user_id', $user->id)
            ->where('video_id', $video->id)
            ->first();

        // If no progress exists, return null instead of error
        return response()->json([
            'success' => true,
            'data' => $progress, // Can be null if no progress yet
        ]);
    }

    /**
     * Get user's progress for a specific series.
     */
    public function getSeriesProgress(Series $series): JsonResponse
    {
        $user = Auth::user();

        $progress = UserProgress::where('user_id', $user->id)
            ->where('series_id', $series->id)
            ->first();

        // Get progress for all videos in series
        $videoProgress = UserProgress::where('user_id', $user->id)
            ->where('series_id', $series->id)
            ->with('video')
            ->get()
            ->keyBy('video_id');

        return response()->json([
            'success' => true,
            'data' => [
                'series_progress' => $progress,
                'video_progress' => $videoProgress,
            ],
        ]);
    }

    /**
     * Mark video as favorite.
     */
    public function toggleFavorite(Video $video): JsonResponse
    {
        $user = Auth::user();

        $progress = UserProgress::where('user_id', $user->id)
            ->where('video_id', $video->id)
            ->first();

        Log::info('Toggle Favorite', [
            'user_id' => $user->id,
            'video_id' => $video->id,
            'progress_exists' => $progress !== null,
            'current_favorite' => $progress ? $progress->is_favorite : null,
        ]);

        if (!$progress) {
            // Create new progress record
            $progress = UserProgress::create([
                'user_id' => $user->id,
                'category_id' => $video->category_id,
                'video_id' => $video->id,
                'is_favorite' => true,
                'favorited_at' => now(),
                'first_watched_at' => now(),
            ]);
        } else {
            // Toggle favorite status
            $newFavoriteStatus = !$progress->is_favorite;
            $progress->is_favorite = $newFavoriteStatus;
            $progress->favorited_at = $newFavoriteStatus ? now() : null;
            $progress->save(); // Explicitly save
        }

        $progress->refresh(); // Refresh to get latest data from database

        Log::info('Favorite Toggled', [
            'user_id' => $user->id,
            'video_id' => $video->id,
            'is_favorite' => $progress->is_favorite,
            'favorited_at' => $progress->favorited_at,
        ]);

        return response()->json([
            'success' => true,
            'message' => $progress->is_favorite ? 'Added to favorites.' : 'Removed from favorites.',
            'data' => $progress->fresh(), // Return fresh data from database
        ]);
    }

    /**
     * Rate a video.
     */
    public function rateVideo(Request $request, Video $video): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:1000',
        ]);

        $progress = UserProgress::where('user_id', $user->id)
            ->where('video_id', $video->id)
            ->first();

        if (!$progress) {
            // Create new progress record
            $progress = UserProgress::create([
                'user_id' => $user->id,
                'category_id' => $video->category_id,
                'video_id' => $video->id,
                'rating' => $validated['rating'],
                'review' => $validated['review'] ?? null,
                'first_watched_at' => now(),
            ]);
        } else {
            // Update rating
            $progress->update([
                'rating' => $validated['rating'],
                'review' => $validated['review'] ?? null,
            ]);
        }

        // Update video rating statistics
        $this->updateVideoRating($video);

        return response()->json([
            'success' => true,
            'message' => 'Rating submitted successfully.',
            'data' => $progress,
        ]);
    }

    /**
     * Get user's learning statistics.
     */
    public function getStats(): JsonResponse
    {
        $user = Auth::user();
        $stats = UserProgress::getUserStats($user);

        // Get additional stats
        $favoriteCount = UserProgress::forUser($user->id)->favorites()->count();
        $recentlyWatched = UserProgress::forUser($user->id)
            ->with(['video.category'])
            ->orderBy('last_watched_at', 'desc')
            ->limit(10)
            ->get();

        $stats['favorite_count'] = $favoriteCount;
        $stats['recently_watched'] = $recentlyWatched;

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get continue watching (incomplete videos).
     */
    public function continueWatching(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Get videos with progress, excluding completed (100%) and 0% progress
        $query = UserProgress::with(['video.category', 'video.instructor', 'category'])
            ->where('user_id', $user->id)
            ->whereNotNull('video_id')
            ->where(function ($q) {
                $q->where('is_completed', false)
                  ->orWhere(function ($qq) {
                      // Include completed but less than 100% progress
                      $qq->where('progress_percentage', '<', 100);
                  });
            })
            ->where('progress_percentage', '>', 0)
            ->orderBy('last_watched_at', 'desc');

        $progress = $query->limit($request->get('limit', 10))->get();

        // Filter out null videos and ensure we have video relationship
        $filteredProgress = $progress->filter(function ($item) {
            return $item->video !== null;
        });

        return response()->json([
            'success' => true,
            'data' => $filteredProgress->values(),
        ]);
    }

    /**
     * Get user's favorite content.
     */
    public function favorites(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = UserProgress::with(['video.category', 'category'])
            ->where('user_id', $user->id)
            ->favorites()
            ->orderBy('favorited_at', 'desc');

        $favorites = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $favorites,
        ]);
    }

    /**
     * Get completed content.
     */
    public function completed(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = UserProgress::with(['video.category', 'category'])
            ->where('user_id', $user->id)
            ->completed()
            ->orderBy('completed_at', 'desc');

        $completed = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $completed,
        ]);
    }

    /**
     * Toggle like on a video.
     */
    public function toggleLike(Video $video): JsonResponse
    {
        $user = Auth::user();

        $progress = UserProgress::where('user_id', $user->id)
            ->where('video_id', $video->id)
            ->first();

        Log::info('Toggle Like', [
            'user_id' => $user->id,
            'video_id' => $video->id,
            'progress_exists' => $progress !== null,
            'current_liked' => $progress ? $progress->is_liked : null,
            'current_disliked' => $progress ? $progress->is_disliked : null,
        ]);

        if (!$progress) {
            // Create new progress record
            $progress = UserProgress::create([
                'user_id' => $user->id,
                'category_id' => $video->category_id,
                'video_id' => $video->id,
                'is_liked' => true,
                'is_disliked' => false,
                'liked_at' => now(),
                'first_watched_at' => now(),
            ]);
        } else {
            // Toggle like status
            if ($progress->is_disliked) {
                // If disliked, remove dislike and add like
                $progress->is_liked = true;
                $progress->is_disliked = false;
                $progress->liked_at = now();
            } else if ($progress->is_liked) {
                // If liked, remove like
                $progress->is_liked = false;
                $progress->liked_at = null;
            } else {
                // If neither, add like
                $progress->is_liked = true;
                $progress->liked_at = now();
            }
            $progress->save(); // Explicitly save
        }

        $progress->refresh(); // Refresh to get latest data from database

        Log::info('Like Toggled', [
            'user_id' => $user->id,
            'video_id' => $video->id,
            'is_liked' => $progress->is_liked,
            'is_disliked' => $progress->is_disliked,
            'liked_at' => $progress->liked_at,
        ]);

        return response()->json([
            'success' => true,
            'message' => $progress->is_liked ? 'Video liked.' : 'Like removed.',
            'data' => $progress->fresh(), // Return fresh data from database
        ]);
    }

    /**
     * Toggle dislike on a video.
     */
    public function toggleDislike(Video $video): JsonResponse
    {
        $user = Auth::user();

        $progress = UserProgress::where('user_id', $user->id)
            ->where('video_id', $video->id)
            ->first();

        Log::info('Toggle Dislike', [
            'user_id' => $user->id,
            'video_id' => $video->id,
            'progress_exists' => $progress !== null,
            'current_liked' => $progress ? $progress->is_liked : null,
            'current_disliked' => $progress ? $progress->is_disliked : null,
        ]);

        if (!$progress) {
            // Create new progress record
            $progress = UserProgress::create([
                'user_id' => $user->id,
                'category_id' => $video->category_id,
                'video_id' => $video->id,
                'is_liked' => false,
                'is_disliked' => true,
                'first_watched_at' => now(),
            ]);
        } else {
            // Toggle dislike status
            if ($progress->is_liked) {
                // If liked, remove like and add dislike
                $progress->is_liked = false;
                $progress->is_disliked = true;
                $progress->liked_at = null;
            } else if ($progress->is_disliked) {
                // If disliked, remove dislike
                $progress->is_disliked = false;
            } else {
                // If neither, add dislike
                $progress->is_disliked = true;
            }
            $progress->save(); // Explicitly save
        }

        $progress->refresh(); // Refresh to get latest data from database

        Log::info('Dislike Toggled', [
            'user_id' => $user->id,
            'video_id' => $video->id,
            'is_liked' => $progress->is_liked,
            'is_disliked' => $progress->is_disliked,
        ]);

        return response()->json([
            'success' => true,
            'message' => $progress->is_disliked ? 'Video disliked.' : 'Dislike removed.',
            'data' => $progress->fresh(), // Return fresh data from database
        ]);
    }

    /**
     * Get user's favorites with full video data.
     */
    public function getFavorites(): JsonResponse
    {
        $user = Auth::user();

        $favorites = UserProgress::forUser($user->id)
            ->favorites()
            ->with(['video.category', 'video.instructor'])
            ->orderBy('favorited_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $favorites,
        ]);
    }

    /**
     * Update video rating statistics.
     */
    private function updateVideoRating(Video $video): void
    {
        $ratings = UserProgress::where('video_id', $video->id)
            ->whereNotNull('rating')
            ->get();

        if ($ratings->count() > 0) {
            $averageRating = $ratings->avg('rating');
            $video->update([
                'rating' => round($averageRating, 2),
                'rating_count' => $ratings->count(),
            ]);
        }
    }
}