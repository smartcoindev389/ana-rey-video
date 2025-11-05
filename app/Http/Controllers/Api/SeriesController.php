<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\WebpConversionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class SeriesController extends Controller
{
    protected $webpService;

    public function __construct(WebpConversionService $webpService)
    {
        $this->webpService = $webpService;
    }
    /**
     * Display a listing of series (using categories table).
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Use Category model as Series
        $query = Category::query();

        // Check if this is an admin request (admin routes)
        $isAdminRequest = $request->is('api/admin/*');

        // Filter by active status for non-admin requests
        if (!$isAdminRequest) {
            $query->where('is_active', true);
        }

        // Filter by category_id for compatibility
        if ($request->has('category_id')) {
            $query->where('id', $request->get('category_id'));
        }

        // Filter by active status
        if ($request->has('status')) {
            $query->where('is_active', $request->get('status'));
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'sort_order');
        $sortOrder = $request->get('sort_order', 'asc');
        
        switch ($sortBy) {
            case 'name':
                $query->orderBy('name', $sortOrder);
                break;
            case 'sort_order':
                $query->orderBy('sort_order', $sortOrder);
                break;
            default:
                $query->orderBy('sort_order', 'asc');
        }

        $categories = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Store a newly created series (using category table).
     */
    public function store(Request $request): JsonResponse
    {
        // Accept both category fields (name) and series fields (title)
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:255',
            'image_file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
            'image' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'status' => 'nullable|in:draft,published,archived',
            'visibility' => 'nullable|in:freemium,basic,premium',
            'sort_order' => 'nullable|integer|min:0',
            'thumbnail' => 'nullable|string|max:255',
            'cover_image' => 'nullable|string|max:255',
            'trailer_url' => 'nullable|url|max:255',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'is_free' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'featured_until' => 'nullable|date',
            'tags' => 'nullable|json',
        ]);

        // Handle image file upload
        if ($request->hasFile('image_file')) {
            try {
                $imageUploadResult = $this->webpService->convertToWebP(
                    $request->file('image_file'),
                    'data_section/image'
                );
                $validated['image'] = $imageUploadResult['path'];
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload category image: ' . $e->getMessage(),
                ], 500);
            }
        }

        // Map title to name if name is not provided (for frontend compatibility)
        if (!isset($validated['name']) && isset($validated['title'])) {
            $validated['name'] = $validated['title'];
        }
        
        // Validate that name exists
        if (!isset($validated['name']) || empty($validated['name'])) {
            return response()->json([
                'success' => false,
                'message' => 'Name or title is required.',
            ], 422);
        }
        
        // Check uniqueness
        if (Category::where('name', $validated['name'])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A category with this name already exists.',
            ], 422);
        }

        $validated['slug'] = Str::slug($validated['name']);
        
        // Set default values
        if (!isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }
        if (!isset($validated['sort_order'])) {
            // Get max sort_order and add 1
            $maxSortOrder = Category::max('sort_order') ?? 0;
            $validated['sort_order'] = $maxSortOrder + 1;
        }

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Series created successfully.',
            'data' => $category,
        ], 201);
    }

    /**
     * Display the specified series (using category table).
     */
    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }

    /**
     * Update the specified series (using category table).
     */
    public function update(Request $request, $id): JsonResponse
    {
        // Find category by ID
        $category = Category::findOrFail($id);
        
        // Check if user is admin
        if (!Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to edit this series.',
            ], 403);
        }

        // Accept both category fields (name) and series fields (title)
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:255',
            'image_file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
            'image' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'status' => 'nullable|in:draft,published,archived',
            'visibility' => 'nullable|in:freemium,basic,premium',
            'sort_order' => 'nullable|integer|min:0',
            'thumbnail' => 'nullable|string|max:255',
            'cover_image' => 'nullable|string|max:255',
            'trailer_url' => 'nullable|url|max:255',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'is_free' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'featured_until' => 'nullable|date',
            'tags' => 'nullable|json',
        ]);

        // Handle image file upload
        if ($request->hasFile('image_file')) {
            try {
                // Delete old image if exists
                if ($category->image) {
                    $this->webpService->deleteFile($category->image);
                }

                $imageUploadResult = $this->webpService->convertToWebP(
                    $request->file('image_file'),
                    'data_section/image'
                );
                $validated['image'] = $imageUploadResult['path'];
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload category image: ' . $e->getMessage(),
                ], 500);
            }
        }
        
        // Map title to name if name is not provided (for frontend compatibility)
        if (!isset($validated['name']) && isset($validated['title'])) {
            $validated['name'] = $validated['title'];
        }
        
        // Check uniqueness if name is being updated
        if (isset($validated['name']) && $validated['name'] !== $category->name) {
            if (Category::where('name', $validated['name'])->where('id', '!=', $category->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'A category with this name already exists.',
                ], 422);
            }
        }

        // Update slug if name changed
        if ($category->name !== $validated['name']) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Series updated successfully.',
            'data' => $category,
        ]);
    }

    /**
     * Remove the specified series (using category table).
     */
    public function destroy($id): JsonResponse
    {
        // Find category by ID
        $category = Category::findOrFail($id);
        
        // Check if user is admin
        if (!Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this series.',
            ], 403);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Series deleted successfully.',
        ]);
    }

    /**
     * Get featured series (using category table).
     */
    public function featured(Request $request): JsonResponse
    {
        $categories = Category::where('is_active', true)
            ->orderBy('sort_order')
            ->limit($request->get('limit', 10))
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get popular series (using category table).
     */
    public function popular(Request $request): JsonResponse
    {
        $categories = Category::where('is_active', true)
            ->orderBy('sort_order')
            ->limit($request->get('limit', 10))
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get new releases (using category table).
     */
    public function newReleases(Request $request): JsonResponse
    {
        $categories = Category::where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->limit($request->get('limit', 10))
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get recommended series for user (using category table).
     */
    public function recommended(Request $request): JsonResponse
    {
        $categories = Category::where('is_active', true)
            ->orderBy('sort_order')
            ->limit($request->get('limit', 10))
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }
}