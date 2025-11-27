<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\Series;
use App\Services\WebpConversionService;
use App\Services\VideoTranscodingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class VideoController extends Controller
{
    protected $webpService;
    protected $transcodingService;

    public function __construct(
        WebpConversionService $webpService,
        VideoTranscodingService $transcodingService
    ) {
        $this->webpService = $webpService;
        $this->transcodingService = $transcodingService;
    }
    /**
     * Display a listing of videos.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Video::with(['series', 'instructor'])->withCount('comments');

        // Check if this is an admin request (admin routes)
        $isAdminRequest = $request->is('api/admin/*');

        // Apply visibility filters based on user subscription (skip for admin)
        if (!$isAdminRequest) {
            if ($user) {
                // Default to freemium if subscription_type is null/empty
                $subscriptionType = $user->subscription_type ?: 'freemium';
                $query->visibleTo($subscriptionType);
            } else {
                $query->where('visibility', 'freemium');
            }
        }

        // Filter by series_id
        if ($request->has('series_id')) {
            $query->where('series_id', $request->get('series_id'));
        }
        
        // Legacy support: also accept category_id (maps to series_id)
        if ($request->has('category_id') && !$request->has('series_id')) {
            $query->where('series_id', $request->get('category_id'));
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
            case 'comments':
            case 'reviews':
                $query->orderBy('comments_count', $sortOrder);
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
        // Pre-process request data - decode JSON strings for array fields
        $requestData = $request->all();
        
        // Handle tags - decode if it's a JSON string
        if ($request->has('tags') && is_string($request->get('tags'))) {
            try {
                $decoded = json_decode($request->get('tags'), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $requestData['tags'] = $decoded;
                } else {
                    // If it's not valid JSON or not an array, try to parse as comma-separated string
                    $tags = array_filter(array_map('trim', explode(',', $request->get('tags'))));
                    $requestData['tags'] = !empty($tags) ? array_values($tags) : null;
                }
            } catch (\Exception $e) {
                // If parsing fails, set to null
                $requestData['tags'] = null;
            }
        }
        
        // Handle downloadable_resources - decode if it's a JSON string
        if ($request->has('downloadable_resources') && is_string($request->get('downloadable_resources'))) {
            try {
                $decoded = json_decode($request->get('downloadable_resources'), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $requestData['downloadable_resources'] = $decoded;
                } else {
                    $requestData['downloadable_resources'] = null;
                }
            } catch (\Exception $e) {
                $requestData['downloadable_resources'] = null;
            }
        }
        
        // Handle streaming_urls - decode if it's a JSON string
        if ($request->has('streaming_urls') && is_string($request->get('streaming_urls'))) {
            try {
                $decoded = json_decode($request->get('streaming_urls'), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $requestData['streaming_urls'] = $decoded;
                } else {
                    $requestData['streaming_urls'] = null;
                }
            } catch (\Exception $e) {
                $requestData['streaming_urls'] = null;
            }
        }
        
        // Merge the processed data back into the request
        $request->merge($requestData);

        // var_dump($request->all());
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:videos,title',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'series_id' => 'required|exists:series,id',
            // Legacy local video fields (kept for backward compatibility, not used for new content)
            'video_url' => 'nullable|url|max:255',
            'video_file_path' => 'nullable|string|max:255',
            // Bunny.net fields (primary source for new content)
            'bunny_video_id' => 'nullable|string|max:255',
            'bunny_video_url' => 'nullable|url|max:500',
            'bunny_embed_url' => 'required_without_all:video_url,video_file_path|url|max:500',
            'bunny_thumbnail_url' => 'nullable|url|max:500',
            'thumbnail' => 'nullable|string|max:255',
            'intro_image_file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
            'intro_image' => 'nullable|string|max:255',
            'intro_description' => 'nullable|string',
            // duration is auto-computed from uploaded file
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
        
        // Legacy support: accept category_id and map to series_id
        if (!isset($validated['series_id']) && $request->has('category_id')) {
            $validated['series_id'] = $request->get('category_id');
        }
        
        // Validate that series_id exists
        if (!isset($validated['series_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Series ID is required.',
            ], 422);
        }

        $validated['slug'] = Str::slug($validated['title']);
        $validated['instructor_id'] = Auth::id();

        // Handle intro image file upload
        if ($request->hasFile('intro_image_file')) {
            try {
                $imageUploadResult = $this->webpService->convertToWebP(
                    $request->file('intro_image_file'),
                    'data_section/image'
                );
                $validated['intro_image'] = $imageUploadResult['path'];
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload intro image: ' . $e->getMessage(),
                ], 500);
            }
        }
        
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
            'data' => $video->load(['category', 'instructor']),
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

        $video->load(['category', 'instructor']);

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

        // Pre-process request data - decode JSON strings for array fields
        $requestData = $request->all();
        
        // Handle tags - decode if it's a JSON string
        if ($request->has('tags') && is_string($request->get('tags'))) {
            try {
                $decoded = json_decode($request->get('tags'), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $requestData['tags'] = $decoded;
                } else {
                    // If it's not valid JSON or not an array, try to parse as comma-separated string
                    $tags = array_filter(array_map('trim', explode(',', $request->get('tags'))));
                    $requestData['tags'] = !empty($tags) ? array_values($tags) : null;
                }
            } catch (\Exception $e) {
                // If parsing fails, set to null
                $requestData['tags'] = null;
            }
        }
        
        // Handle downloadable_resources - decode if it's a JSON string
        if ($request->has('downloadable_resources') && is_string($request->get('downloadable_resources'))) {
            try {
                $decoded = json_decode($request->get('downloadable_resources'), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $requestData['downloadable_resources'] = $decoded;
                } else {
                    $requestData['downloadable_resources'] = null;
                }
            } catch (\Exception $e) {
                $requestData['downloadable_resources'] = null;
            }
        }
        
        // Handle streaming_urls - decode if it's a JSON string
        if ($request->has('streaming_urls') && is_string($request->get('streaming_urls'))) {
            try {
                $decoded = json_decode($request->get('streaming_urls'), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $requestData['streaming_urls'] = $decoded;
                } else {
                    $requestData['streaming_urls'] = null;
                }
            } catch (\Exception $e) {
                $requestData['streaming_urls'] = null;
            }
        }
        
        // Merge the processed data back into the request
        $request->merge($requestData);
        
        $validated = $request->validate([
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('videos', 'title')->ignore($video->id),
            ],
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'series_id' => 'nullable|exists:series,id',
            // Legacy local video fields (kept for backward compatibility, not used for new content)
            'video_url' => 'nullable|url|max:255',
            'video_file_path' => 'nullable|string|max:255',
            // Bunny.net fields (primary source for new content)
            'bunny_video_id' => 'nullable|string|max:255',
            'bunny_video_url' => 'nullable|url|max:500',
            'bunny_embed_url' => 'required_without_all:video_url,video_file_path|url|max:500',
            'bunny_thumbnail_url' => 'nullable|url|max:500',
            'thumbnail' => 'nullable|string|max:255',
            'intro_image_file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
            'intro_image' => 'nullable|string|max:255',
            'intro_description' => 'nullable|string',
            // duration is auto-computed from uploaded file
            'duration' => 'nullable|integer|min:0',
            'file_size' => 'nullable|integer|min:0',
            'video_format' => 'nullable|string|max:50',
            'video_quality' => 'nullable|string|max:50',
            'hls_url' => 'nullable|url|max:255',
            'dash_url' => 'nullable|url|max:255',
            'streaming_urls' => 'nullable|array',
            'visibility' => 'nullable|in:freemium,basic,premium',
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
        
        // Legacy support: accept category_id and map to series_id
        if (!isset($validated['series_id']) && $request->has('category_id')) {
            $validated['series_id'] = $request->get('category_id');
        }

        // Legacy local video file handling (kept for backward compatibility, no longer used for new content)
        if ($request->has('video_file_path')) {
            // Handle video file path update (may include copying for duplicating videos)
            $newPath = $request->get('video_file_path');
            $originalPath = $video->video_file_path;
            
            // If the new path is the same as an existing video's path (copy scenario), copy the file
            if ($newPath && $newPath !== $originalPath) {
                // Check if another video uses this path (copy scenario)
                $existingVideo = Video::where('video_file_path', $newPath)
                    ->where('id', '!=', $video->id)
                    ->first();
                
                if ($existingVideo && $originalPath) {
                    // Copy from original video to new location
                    try {
                        \Log::info('Copying video file for duplicate', [
                            'video_id' => $video->id,
                            'from' => $originalPath,
                            'existing_path' => $newPath,
                        ]);
                        
                        $copyResult = $this->webpService->copyVideoFile($originalPath);
                        $validated['video_file_path'] = $copyResult['path'];
                        $validated['file_size'] = $copyResult['size'];
                        $validated['video_format'] = pathinfo($copyResult['path'], PATHINFO_EXTENSION);
                        
                        \Log::info('Video file copied successfully', [
                            'path' => $copyResult['path'],
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Failed to copy video file', [
                            'error' => $e->getMessage(),
                        ]);
                        // If copy fails, still try to use the provided path
                        $validated['video_file_path'] = $newPath;
                    }
                } else {
                    // Path is being changed to a new/different path
                    // Delete old video file if it exists and is different from new path
                    if ($originalPath && $originalPath !== $newPath) {
                        $this->webpService->deleteFile($originalPath);
                    }
                    $validated['video_file_path'] = $newPath;
                }
            } else {
                // Path is the same, no change needed
                // Don't override it in validated to keep original
            }
        } else {
            \Log::info('No new video file in update request', [
                'video_id' => $video->id,
            ]);
        }

        // Handle intro image file upload
        if ($request->hasFile('intro_image_file')) {
            try {
                // Delete old intro image if exists
                if ($video->intro_image) {
                    $this->webpService->deleteFile($video->intro_image);
                }

                $imageUploadResult = $this->webpService->convertToWebP(
                    $request->file('intro_image_file'),
                    'data_section/image'
                );
                $validated['intro_image'] = $imageUploadResult['path'];
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload intro image: ' . $e->getMessage(),
                ], 500);
            }
        }

        // Update slug if title changed (use raw original value to avoid translation issues)
        if (isset($validated['title']) && $video->getRawOriginal('title') !== $validated['title']) {
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
            'data' => $video->load(['category', 'instructor']),
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

        // Delete associated media files from storage (images only)
        try {
            if (!empty($video->intro_image)) {
                $this->webpService->deleteFile($video->intro_image);
            }
            if (!empty($video->thumbnail)) {
                $this->webpService->deleteFile($video->thumbnail);
            }
        } catch (\Throwable $e) {
            \Log::warning('Failed to delete one or more media files for video', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
            ]);
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
            // Default to freemium if subscription_type is null/empty
            $subscriptionType = $user->subscription_type ?: 'freemium';
            $query->visibleTo($subscriptionType);
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
     * For Bunny.net videos, redirect to Bunny.net URL or return embed URL.
     */
    public function stream(Request $request, Video $video)
    {
        $user = Auth::user();

        // Check access permissions
        if (!$video->isAccessibleTo($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this video.',
            ], 403);
        }

        // Priority 1: Bunny.net video URL
        if ($video->bunny_video_url) {
            \Log::info('Video stream redirect to Bunny.net', [
                'video_id' => $video->id,
                'bunny_video_id' => $video->bunny_video_id,
                'url' => $video->bunny_video_url,
            ]);
            return redirect()->away($video->bunny_video_url);
        }

        // Priority 2: Direct video URL
        if ($video->video_url) {
            \Log::info('Video stream redirect to direct URL', [
                'video_id' => $video->id,
                'url' => $video->video_url,
            ]);
            return redirect()->away($video->video_url);
        }

        // Priority 3: Legacy local file streaming (for backward compatibility)
        if ($video->video_file_path && !str_starts_with($video->video_file_path, 'http')) {
            $path = storage_path('app/public/' . $video->video_file_path);

            if (file_exists($path)) {
                $fileSize = filesize($path);
                $mimeType = mime_content_type($path) ?: 'video/mp4';

                $headers = [
                    'Content-Type' => $mimeType,
                    'Content-Length' => $fileSize,
                    'Accept-Ranges' => 'bytes',
                    'Cache-Control' => 'public, max-age=31536000',
                ];

                if ($request->header('Range')) {
                    $range = $request->header('Range');
                    $range = str_replace('bytes=', '', $range);
                    $rangeParts = explode('-', $range);
                    $start = max(0, intval($rangeParts[0]));
                    $end = isset($rangeParts[1]) && $rangeParts[1] !== '' ? intval($rangeParts[1]) : $fileSize - 1;
                    $end = min($end, $fileSize - 1);

                    if ($start > $end) {
                        $start = 0;
                    }

                    $length = $end - $start + 1;
                    $headers['Content-Range'] = "bytes {$start}-{$end}/{$fileSize}";
                    $headers['Content-Length'] = $length;

                    return response()->stream(function () use ($path, $start, $length) {
                        $chunkSize = 8192;
                        $stream = fopen($path, 'rb');
                        fseek($stream, $start);
                        $bytesLeft = $length;
                        while ($bytesLeft > 0 && !feof($stream)) {
                            $read = ($bytesLeft > $chunkSize) ? $chunkSize : $bytesLeft;
                            echo fread($stream, $read);
                            $bytesLeft -= $read;
                            @ob_flush();
                            flush();
                        }
                        fclose($stream);
                    }, 206, $headers);
                }

                return response()->stream(function () use ($path) {
                    $chunkSize = 8192;
                    $stream = fopen($path, 'rb');
                    while (!feof($stream)) {
                        echo fread($stream, $chunkSize);
                        @ob_flush();
                        flush();
                    }
                    fclose($stream);
                }, 200, $headers);
            }
        }

        // Fallback: Return JSON with video information
        return response()->json([
            'success' => true,
            'data' => [
                'video_id' => $video->id,
                'title' => $video->title,
                'duration' => $video->duration,
                'bunny_embed_url' => $video->bunny_embed_url,
                'bunny_video_url' => $video->bunny_video_url,
                'video_url' => $video->video_url,
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

    /**
     * Re-encode video with web-compatible codecs (admin only)
     */
    public function reencode(Request $request, $id): JsonResponse
    {
        $video = Video::findOrFail($id);

        if (!$video->video_file_path) {
            return response()->json([
                'success' => false,
                'message' => 'Video has no file path to re-encode',
            ], 400);
        }

        $fullPath = storage_path('app/public/' . $video->video_file_path);
        
        if (!file_exists($fullPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Video file not found: ' . $video->video_file_path,
            ], 404);
        }

        try {
            $options = [
                'audio_bitrate' => 128,
                'video_quality' => 23,
                'preset' => 'medium',
                'delete_original' => true,
            ];

            $result = $this->transcodingService->reencodeStorageVideo(
                $video->video_file_path,
                $options
            );

            if ($result['success']) {
                $video->video_file_path = $result['relative_path'];
                $video->file_size = $result['new_size'];
                $video->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Video re-encoded successfully',
                    'data' => [
                        'video' => $video,
                        'original_size' => $result['original_size'],
                        'new_size' => $result['new_size'],
                        'size_saved' => $result['original_size'] - $result['new_size'],
                    ],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Re-encoding failed: ' . $result['message'],
                ], 500);
            }
        } catch (\Exception $e) {
            \Log::error('Video re-encoding failed', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Re-encoding failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get codec/media info for a video's current file (admin/debugging).
     */
    public function codecInfo($id): JsonResponse
    {
        $video = Video::findOrFail($id);

        if (!$video->video_file_path) {
            return response()->json([
                'success' => false,
                'message' => 'No local video_file_path set for this video.',
            ], 400);
        }

        $path = storage_path('app/public/' . $video->video_file_path);

        if (!file_exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'File does not exist at: ' . $video->video_file_path,
            ], 404);
        }

        try {
            $info = $this->transcodingService->getVideoInfo($path);

            return response()->json([
                'success' => true,
                'data' => [
                    'video_id' => $video->id,
                    'file' => $video->video_file_path,
                    'info' => $info,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to probe video: ' . $e->getMessage(),
            ], 500);
        }
    }
}