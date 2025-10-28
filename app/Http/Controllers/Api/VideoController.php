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
        
        $query = Video::with(['category', 'instructor']);

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

        // Filter by category (updated from series_id to category_id)
        if ($request->has('category_id')) {
            $query->where('category_id', $request->get('category_id'));
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

        // var_dump($request->all());
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:videos,title',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'category_id' => 'nullable|exists:categories,id',
            'series_id' => 'nullable|exists:categories,id', // Accept series_id for compatibility
            'video_file' => 'nullable|file|mimes:mp4,mov,avi,webm|max:512000', // 500MB max
            'video_url' => 'nullable|url|max:255',
            'video_file_path' => 'nullable|string|max:255',
            'thumbnail' => 'nullable|string|max:255',
            'intro_image_file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
            'intro_image' => 'nullable|string|max:255',
            'intro_description' => 'nullable|string',
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
        
        // Map series_id to category_id for compatibility (series = category in backend)
        if (!isset($validated['category_id']) && isset($validated['series_id'])) {
            $validated['category_id'] = $validated['series_id'];
        }
        
        // Validate that category_id exists
        if (!isset($validated['category_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Category ID or Series ID is required.',
            ], 422);
        }

        $validated['slug'] = Str::slug($validated['title']);
        $validated['instructor_id'] = Auth::id();
        
        // Handle video file upload
        if ($request->hasFile('video_file')) {
            try {
                \Log::info('Video file upload started', [
                    'filename' => $request->file('video_file')->getClientOriginalName(),
                    'size' => $request->file('video_file')->getSize(),
                    'mime' => $request->file('video_file')->getMimeType(),
                ]);
                
                $videoUploadResult = $this->webpService->saveVideo($request->file('video_file'));
                $originalPath = $videoUploadResult['path'];
                
                \Log::info('Video file uploaded successfully', [
                    'path' => $originalPath,
                    'size' => $videoUploadResult['size'],
                ]);
                
                // Re-encode video with web-compatible codecs (H.264 + AAC)
                // This fixes audio codec issues that prevent playback in browsers
                try {
                    \Log::info('Starting video re-encoding for web compatibility');
                    
                    $reencodeResult = $this->transcodingService->reencodeStorageVideo(
                        $originalPath,
                        [
                            'audio_bitrate' => 128,      // 128kbps AAC audio (good quality)
                            'video_quality' => 23,       // CRF 23 (good quality, smaller file)
                            'preset' => 'medium',        // Encoding speed preset
                            'delete_original' => true,   // Delete original to save space
                        ]
                    );
                    
                    if ($reencodeResult['success']) {
                        \Log::info('Video re-encoded successfully', [
                            'original_path' => $originalPath,
                            'new_path' => $reencodeResult['relative_path'],
                            'original_size' => $reencodeResult['original_size'],
                            'new_size' => $reencodeResult['new_size'],
                            'size_saved' => $reencodeResult['original_size'] - $reencodeResult['new_size'],
                        ]);
                        
                        // Use re-encoded video
                        $validated['video_file_path'] = $reencodeResult['relative_path'];
                        $validated['file_size'] = $reencodeResult['new_size'];
                    } else {
                        \Log::warning('Video re-encoding failed, using original', [
                            'error' => $reencodeResult['message'],
                        ]);
                        
                        // Fall back to original video
                        $validated['video_file_path'] = $originalPath;
                        $validated['file_size'] = $videoUploadResult['size'];
                    }
                } catch (\Exception $e) {
                    \Log::error('Video re-encoding error', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    
                    // Fall back to original video if re-encoding fails
                    $validated['video_file_path'] = $originalPath;
                    $validated['file_size'] = $videoUploadResult['size'];
                }
                
                $validated['video_format'] = pathinfo($validated['video_file_path'], PATHINFO_EXTENSION);
            } catch (\Exception $e) {
                \Log::error('Video file upload failed', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload video file: ' . $e->getMessage(),
                ], 500);
            }
        } else {
            \Log::warning('No video file in request', [
                'has_video_file' => $request->hasFile('video_file'),
                'all_files' => array_keys($request->allFiles()),
            ]);
        }

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
            $lastEpisode = Video::where('category_id', $validated['category_id'])
                ->orderBy('episode_number', 'desc')
                ->first();
            $validated['episode_number'] = $lastEpisode ? $lastEpisode->episode_number + 1 : 1;
        }

        // Set sort order if not provided
        if (!isset($validated['sort_order'])) {
            $lastSortOrder = Video::where('category_id', $validated['category_id'])
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
            'category_id' => 'nullable|exists:categories,id',
            'series_id' => 'nullable|exists:categories,id', // Accept series_id for compatibility
            'video_file' => 'nullable|file|mimes:mp4,mov,avi,webm|max:512000', // 500MB max
            'video_url' => 'nullable|url|max:255',
            'video_file_path' => 'nullable|string|max:255',
            'thumbnail' => 'nullable|string|max:255',
            'intro_image_file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
            'intro_image' => 'nullable|string|max:255',
            'intro_description' => 'nullable|string',
            'duration' => 'nullable|integer|min:0',
            'file_size' => 'nullable|integer|min:0',
            'video_format' => 'nullable|string|max:50',
            'video_quality' => 'nullable|string|max:50',
            'hls_url' => 'nullable|url|max:255',
            'dash_url' => 'nullable|url|max:255',
            'streaming_urls' => 'nullable|array',
            'visibility' => 'sometimes|required|in:freemium,basic,premium',
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
        
        // Map series_id to category_id for compatibility (series = category in backend)
        if (!isset($validated['category_id']) && isset($validated['series_id'])) {
            $validated['category_id'] = $validated['series_id'];
        }

        // Handle video file upload
        if ($request->hasFile('video_file')) {
            try {
                \Log::info('Video file update started', [
                    'video_id' => $video->id,
                    'filename' => $request->file('video_file')->getClientOriginalName(),
                    'size' => $request->file('video_file')->getSize(),
                ]);
                
                // Delete old video file if exists
                if ($video->video_file_path) {
                    $this->webpService->deleteFile($video->video_file_path);
                }

                $videoUploadResult = $this->webpService->saveVideo($request->file('video_file'));
                $validated['video_file_path'] = $videoUploadResult['path'];
                $validated['file_size'] = $videoUploadResult['size'];
                $validated['video_format'] = pathinfo($videoUploadResult['filename'], PATHINFO_EXTENSION);
                
                \Log::info('Video file updated successfully', [
                    'path' => $videoUploadResult['path'],
                ]);
            } catch (\Exception $e) {
                \Log::error('Video file update failed', [
                    'error' => $e->getMessage(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload video file: ' . $e->getMessage(),
                ], 500);
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

        // If video_file_path exists, stream the actual file with proper headers
        if ($video->video_file_path) {
            $path = storage_path('app/public/' . $video->video_file_path);
            
            if (!file_exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found.',
                ], 404);
            }

            $fileSize = filesize($path);
            $mimeType = mime_content_type($path);
            
            // Handle Range requests for video seeking
            $headers = [
                'Content-Type' => $mimeType,
                'Content-Length' => $fileSize,
                'Accept-Ranges' => 'bytes',
                'Cache-Control' => 'public, max-age=31536000',
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers' => 'Range',
                'Access-Control-Expose-Headers' => 'Content-Length, Content-Range',
            ];

            // Check if this is a range request
            if ($request->header('Range')) {
                $range = $request->header('Range');
                $range = str_replace('bytes=', '', $range);
                $rangeParts = explode('-', $range);
                $start = intval($rangeParts[0]);
                $end = isset($rangeParts[1]) && $rangeParts[1] !== '' ? intval($rangeParts[1]) : $fileSize - 1;
                
                $length = $end - $start + 1;
                
                $headers['Content-Range'] = "bytes {$start}-{$end}/{$fileSize}";
                $headers['Content-Length'] = $length;
                
                return response()->stream(function () use ($path, $start, $length) {
                    $stream = fopen($path, 'rb');
                    fseek($stream, $start);
                    echo fread($stream, $length);
                    fclose($stream);
                }, 206, $headers);
            }

            // Full file response
            return response()->stream(function () use ($path) {
                $stream = fopen($path, 'rb');
                fpassthru($stream);
                fclose($stream);
            }, 200, $headers);
        }

        // Fallback to JSON response with URLs
        $quality = $request->get('quality', 'auto');
        $streamingUrls = [];

        if ($quality === 'auto') {
            $streamingUrls = [
                'hls' => $video->hls_url,
                'dash' => $video->dash_url,
                'direct' => $video->video_url_full,
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