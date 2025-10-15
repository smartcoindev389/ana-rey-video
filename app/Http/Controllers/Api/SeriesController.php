<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Series;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class SeriesController extends Controller
{
    /**
     * Display a listing of series.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Series::with(['category', 'instructor']);

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

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        } else if (!$isAdminRequest) {
            // Default to published for public access (admin can see all)
            $query->published();
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->get('category_id'));
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

        // Filter by tags
        if ($request->has('tags')) {
            $tags = is_array($request->get('tags')) ? $request->get('tags') : explode(',', $request->get('tags'));
            $query->where(function ($q) use ($tags) {
                foreach ($tags as $tag) {
                    $q->orWhereJsonContains('tags', trim($tag));
                }
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        switch ($sortBy) {
            case 'title':
                $query->orderBy('title', $sortOrder);
                break;
            case 'rating':
                $query->orderBy('rating', $sortOrder);
                break;
            case 'views':
                $query->orderBy('total_views', $sortOrder);
                break;
            case 'featured':
                $query->featured()->orderBy('published_at', $sortOrder);
                break;
            default:
                $query->orderBy('created_at', $sortOrder);
        }

        // Include video count
        $query->withCount('publishedVideos');

        $series = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $series,
        ]);
    }

    /**
     * Store a newly created series.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:series,title',
            'description' => 'required|string',
            'short_description' => 'nullable|string|max:500',
            'visibility' => 'required|in:freemium,basic,premium',
            'category_id' => 'required|exists:categories,id',
            'thumbnail' => 'nullable|string|max:255',
            'cover_image' => 'nullable|string|max:255',
            'trailer_url' => 'nullable|url|max:255',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'is_free' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'featured_until' => 'nullable|date|after:now',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
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

        $series = Series::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Series created successfully.',
            'data' => $series->load(['category', 'instructor']),
        ], 201);
    }

    /**
     * Display the specified series.
     */
    public function show(Series $series): JsonResponse
    {
        $user = Auth::user();

        // Check access permissions
        if (!$series->isAccessibleTo($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this series.',
            ], 403);
        }

        $series->load([
            'category',
            'instructor',
            'publishedVideos' => function ($q) {
                $q->orderBy('sort_order')->orderBy('episode_number');
            }
        ]);

        // Get user progress if authenticated
        $userProgress = null;
        if ($user) {
            $userProgress = $series->userProgress()
                ->where('user_id', $user->id)
                ->first();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'series' => $series,
                'user_progress' => $userProgress,
            ],
        ]);
    }

    /**
     * Update the specified series.
     */
    public function update(Request $request, $id): JsonResponse
    {
        // Find series by ID instead of slug
        $series = Series::findOrFail($id);
        
        // Check if user can edit this series
        if (!Auth::user()->isAdmin() && $series->instructor_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to edit this series.',
            ], 403);
        }

        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('series', 'title')->ignore($series->id),
            ],
            'description' => 'required|string',
            'short_description' => 'nullable|string|max:500',
            'visibility' => 'required|in:freemium,basic,premium',
            'status' => 'nullable|in:draft,published,archived',
            'category_id' => 'required|exists:categories,id',
            'thumbnail' => 'nullable|string|max:255',
            'cover_image' => 'nullable|string|max:255',
            'trailer_url' => 'nullable|url|max:255',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'is_free' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'featured_until' => 'nullable|date|after:now',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        // Update slug if title changed
        if ($series->title !== $validated['title']) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        // Set published_at if status is being changed to published
        if ($request->has('status') && $request->get('status') === 'published' && $series->status !== 'published') {
            $validated['published_at'] = now();
        }

        $series->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Series updated successfully.',
            'data' => $series->load(['category', 'instructor']),
        ]);
    }

    /**
     * Remove the specified series.
     */
    public function destroy($id): JsonResponse
    {
        // Find series by ID instead of slug
        $series = Series::findOrFail($id);
        
        // Check if user can delete this series
        if (!Auth::user()->isAdmin() && $series->instructor_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this series.',
            ], 403);
        }

        $series->delete();

        return response()->json([
            'success' => true,
            'message' => 'Series deleted successfully.',
        ]);
    }

    /**
     * Get featured series.
     */
    public function featured(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Series::featured()->with(['category', 'instructor']);

        // Apply visibility filters
        if ($user) {
            $query->visibleTo($user->subscription_type);
        } else {
            $query->where('visibility', 'freemium');
        }

        $query->withCount('publishedVideos');

        $series = $query->limit($request->get('limit', 10))->get();

        return response()->json([
            'success' => true,
            'data' => $series,
        ]);
    }

    /**
     * Get popular series.
     */
    public function popular(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Series::published()
            ->with(['category', 'instructor'])
            ->orderBy('total_views', 'desc')
            ->orderBy('rating', 'desc');

        // Apply visibility filters
        if ($user) {
            $query->visibleTo($user->subscription_type);
        } else {
            $query->where('visibility', 'freemium');
        }

        $query->withCount('publishedVideos');

        $series = $query->limit($request->get('limit', 10))->get();

        return response()->json([
            'success' => true,
            'data' => $series,
        ]);
    }

    /**
     * Get new releases.
     */
    public function newReleases(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Series::published()
            ->with(['category', 'instructor'])
            ->orderBy('published_at', 'desc');

        // Apply visibility filters
        if ($user) {
            $query->visibleTo($user->subscription_type);
        } else {
            $query->where('visibility', 'freemium');
        }

        $query->withCount('publishedVideos');

        $series = $query->limit($request->get('limit', 10))->get();

        return response()->json([
            'success' => true,
            'data' => $series,
        ]);
    }

    /**
     * Get recommended series for user.
     */
    public function recommended(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        // Get series based on user's category preferences and viewing history
        $query = Series::published()
            ->with(['category', 'instructor'])
            ->whereNotIn('id', function ($q) use ($user) {
                $q->select('series_id')
                  ->from('user_progress')
                  ->where('user_id', $user->id)
                  ->whereNotNull('series_id');
            });

        // Apply visibility filters
        $query->visibleTo($user->subscription_type);
        $query->withCount('publishedVideos');

        $series = $query->orderBy('rating', 'desc')
            ->orderBy('total_views', 'desc')
            ->limit($request->get('limit', 10))
            ->get();

        return response()->json([
            'success' => true,
            'data' => $series,
        ]);
    }

    /**
     * Check if series is accessible to user.
     */
    public function isAccessibleTo(Request $request, Series $series): JsonResponse
    {
        $user = Auth::user();
        $isAccessible = $series->isAccessibleTo($user);

        return response()->json([
            'success' => true,
            'data' => [
                'accessible' => $isAccessible,
                'series_id' => $series->id,
                'visibility' => $series->visibility,
                'user_subscription' => $user ? $user->subscription_type : 'freemium',
            ],
        ]);
    }
}