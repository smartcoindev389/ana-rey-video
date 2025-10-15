<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class VideoController extends Controller
{
    /**
     * Display a listing of videos.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Video::with(['series', 'instructor']);

        // Check if this is an admin request (admin routes)
        $isAdminRequest = $request->is('api/admin/*');

        // Apply visibility filters based on user subscription (skip for admin)
        if (!$isAdminRequest) {
            if ($user) {
                $query->visibleTo($user->subscription_type);
            } else {
                $query->where('visibility', 'freemium');
            }
        }

        // Filter by series
        if ($request->has('series_id')) {
            $query->where('series_id', $request->get('series_id'));
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        } else if (!$isAdminRequest) {
            // Default to published for public access (admin can see all)
            $query->published();
        }

        // Filter by visibility
        if ($request->has('visibility')) {
            $query->where('visibility', $request->get('visibility'));
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'sort_order');
        $sortOrder = $request->get('sort_order', 'asc');
        
        switch ($sortBy) {
            case 'title':
                $query->orderBy('title', $sortOrder);
                break;
            case 'duration':
                $query->orderBy('duration', $sortOrder);
                break;
            case 'views':
                $query->orderBy('views', $sortOrder);
                break;
            case 'episode':
                $query->orderBy('episode_number', $sortOrder);
                break;
            default:
                $query->orderBy('sort_order', $sortOrder)->orderBy('episode_number', $sortOrder);
        }

        $videos = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $videos,
        ]);
    }

    /**
     * Store a newly created video.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:videos,title',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'series_id' => 'required|exists:series,id',
            'video_url' => 'nullable|url|max:255',
            'video_file_path' => 'nullable|string|max:255',
            'thumbnail' => 'nullable|string|max:255',
            'duration' => 'nullable|integer|min:0',
            'file_size' => 'nullable|integer|min:0',
            'video_format' => 'nullable|string|max:50',
            'video_quality' => 'nullable|string|max:50',
            'hls_url' => 'nullable|url|max:255',
            'dash_url' => 'nullable|url|max:255',
            'streaming_urls' => 'nullable|array',
            'visibility' => 'required|in:freemium,basic,premium',
            'status' => 'nullable|in:draft,published,archived',
            'is_free' => 'nullable|boolean',
            'price' => 'nullable|numeric|min:0',
            'episode_number' => 'nullable|integer|min:1',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'downloadable_resources' => 'nullable|array',
            'allow_download' => 'nullable|boolean',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:255',
        ]);

        $validated['slug'] = Str::slug($validated['title']);
        $validated['instructor_id'] = Auth::id();
        
        // Set status default
        if (!isset($validated['status'])) {
            $validated['status'] = 'draft';
        }

        // Set published_at if status is published
        if ($validated['status'] === 'published') {
            $validated['published_at'] = now();
        }

        // Auto-generate episode number if not provided
        if (!isset($validated['episode_number'])) {
            $lastEpisode = Video::where('series_id', $validated['series_id'])
                ->orderBy('episode_number', 'desc')
                ->first();
            $validated['episode_number'] = $lastEpisode ? $lastEpisode->episode_number + 1 : 1;
        }

        // Set sort order if not provided
        if (!isset($validated['sort_order'])) {
            $lastSortOrder = Video::where('series_id', $validated['series_id'])
                ->orderBy('sort_order', 'desc')
                ->first();
            $validated['sort_order'] = $lastSortOrder ? $lastSortOrder->sort_order + 1 : 1;
        }

        $video = Video::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Video created successfully.',
            'data' => $video->load(['series', 'instructor']),
        ], 201);
    }

    /**
     * Display the specified video.
     */
    public function show(Video $video): JsonResponse
    {
        $user = Auth::user();

        // Check access permissions
        if (!$video->isAccessibleTo($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this video.',
            ], 403);
        }

        $video->load(['series', 'instructor']);

        // Get user progress if authenticated
        $userProgress = null;
        if ($user) {
            $userProgress = $video->userProgress()
                ->where('user_id', $user->id)
                ->first();
        }

        // Get next and previous videos
        $nextVideo = $video->getNextVideo();
        $previousVideo = $video->getPreviousVideo();

        // Increment view count
        $video->incrementViews();

        return response()->json([
            'success' => true,
            'data' => [
                'video' => $video,
                'user_progress' => $userProgress,
                'next_video' => $nextVideo,
                'previous_video' => $previousVideo,
            ],
        ]);
    }

    /**
     * Update the specified video.
     */
    public function update(Request $request, $id): JsonResponse
    {
        // Find video by ID instead of slug
        $video = Video::findOrFail($id);
        
        // Check if user can edit this video
        if (!Auth::user()->isAdmin() && $video->instructor_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to edit this video.',
            ], 403);
        }

        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('videos', 'title')->ignore($video->id),
            ],
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'series_id' => 'required|exists:series,id',
            'video_url' => 'nullable|url|max:255',
            'video_file_path' => 'nullable|string|max:255',
            'thumbnail' => 'nullable|string|max:255',
            'duration' => 'nullable|integer|min:0',
            'file_size' => 'nullable|integer|min:0',
            'video_format' => 'nullable|string|max:50',
            'video_quality' => 'nullable|string|max:50',
            'hls_url' => 'nullable|url|max:255',
            'dash_url' => 'nullable|url|max:255',
            'streaming_urls' => 'nullable|array',
            'visibility' => 'required|in:freemium,basic,premium',
            'status' => 'nullable|in:draft,published,archived',
            'is_free' => 'nullable|boolean',
            'price' => 'nullable|numeric|min:0',
            'episode_number' => 'nullable|integer|min:1',
            'sort_order' => 'nullable|integer|min:0',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'downloadable_resources' => 'nullable|array',
            'allow_download' => 'nullable|boolean',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:255',
            'processing_status' => 'nullable|in:pending,processing,completed,failed',
            'processing_error' => 'nullable|string',
        ]);

        // Update slug if title changed
        if ($video->title !== $validated['title']) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        // Set published_at if status is being changed to published
        if ($request->has('status') && $request->get('status') === 'published' && $video->status !== 'published') {
            $validated['published_at'] = now();
        }

        // Set processed_at if processing is completed
        if ($request->has('processing_status') && $request->get('processing_status') === 'completed') {
            $validated['processed_at'] = now();
        }

        $video->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Video updated successfully.',
            'data' => $video->load(['series', 'instructor']),
        ]);
    }

    /**
     * Remove the specified video.
     */
    public function destroy($id): JsonResponse
    {
        // Find video by ID instead of slug
        $video = Video::findOrFail($id);
        
        // Check if user can delete this video
        if (!Auth::user()->isAdmin() && $video->instructor_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this video.',
            ], 403);
        }

        $video->delete();

        return response()->json([
            'success' => true,
            'message' => 'Video deleted successfully.',
        ]);
    }

    /**
     * Get videos in a series.
     */
    public function seriesVideos(Request $request, Series $series): JsonResponse
    {
        $user = Auth::user();

        // Check series access
        if (!$series->isAccessibleTo($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this series.',
            ], 403);
        }

        $query = $series->videos()->with(['instructor']);

        // Apply visibility filters
        if ($user) {
            $query->visibleTo($user->subscription_type);
        } else {
            $query->where('visibility', 'freemium');
        }

        // Only published videos for public access
        $query->published();

        // Sort by episode number and sort order
        $query->orderBy('sort_order')->orderBy('episode_number');

        $videos = $query->get();

        // Get user progress for all videos
        $userProgress = [];
        if ($user) {
            $progressData = $series->userProgress()
                ->where('user_id', $user->id)
                ->get()
                ->keyBy('video_id');
            
            $userProgress = $progressData->toArray();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'videos' => $videos,
                'user_progress' => $userProgress,
                'series' => $series,
            ],
        ]);
    }

    /**
     * Get video streaming URL.
     */
    public function stream(Request $request, Video $video): JsonResponse
    {
        $user = Auth::user();

        // Check access permissions
        if (!$video->isAccessibleTo($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this video.',
            ], 403);
        }

        $quality = $request->get('quality', 'auto');
        $streamingUrls = [];

        // Get appropriate streaming URL based on quality
        if ($quality === 'auto') {
            $streamingUrls = [
                'hls' => $video->hls_url,
                'dash' => $video->dash_url,
                'direct' => $video->video_url,
            ];
        } else {
            $streamingUrls = $video->streaming_urls;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'video_id' => $video->id,
                'title' => $video->title,
                'duration' => $video->duration,
                'streaming_urls' => $streamingUrls,
                'allow_download' => $video->allow_download,
                'downloadable_resources' => $video->downloadable_resources,
            ],
        ]);
    }

    /**
     * Check if video is accessible to user.
     */
    public function isAccessibleTo(Request $request, Video $video): JsonResponse
    {
        $user = Auth::user();
        $isAccessible = $video->isAccessibleTo($user);

        return response()->json([
            'success' => true,
            'data' => [
                'accessible' => $isAccessible,
                'video_id' => $video->id,
                'visibility' => $video->visibility,
                'user_subscription' => $user ? $user->subscription_type : 'freemium',
            ],
        ]);
    }
}