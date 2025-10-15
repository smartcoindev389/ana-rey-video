<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserProgress;
use App\Models\Video;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class UserProgressController extends Controller
{
    /**
     * Display user's progress for all content.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = UserProgress::with(['series', 'video'])
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

        // Filter by series
        if ($request->has('series_id')) {
            $query->where('series_id', $request->get('series_id'));
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

        return response()->json([
            'success' => true,
            'data' => $progress,
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

        if (!$progress) {
            // Create new progress record
            $progress = UserProgress::create([
                'user_id' => $user->id,
                'series_id' => $video->series_id,
                'video_id' => $video->id,
                'is_favorite' => true,
                'favorited_at' => now(),
                'first_watched_at' => now(),
            ]);
        } else {
            // Toggle favorite status
            $progress->update([
                'is_favorite' => !$progress->is_favorite,
                'favorited_at' => !$progress->is_favorite ? now() : null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $progress->is_favorite ? 'Added to favorites.' : 'Removed from favorites.',
            'data' => $progress,
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
                'series_id' => $video->series_id,
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
            ->with(['video.series'])
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

        $query = UserProgress::with(['video.series'])
            ->where('user_id', $user->id)
            ->where('is_completed', false)
            ->where('progress_percentage', '>', 0)
            ->orderBy('last_watched_at', 'desc');

        $progress = $query->limit($request->get('limit', 10))->get();

        return response()->json([
            'success' => true,
            'data' => $progress,
        ]);
    }

    /**
     * Get user's favorite content.
     */
    public function favorites(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = UserProgress::with(['video.series', 'series'])
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

        $query = UserProgress::with(['video.series', 'series'])
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