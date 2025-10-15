<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index(Request $request): JsonResponse
    {
        // Check if this is an admin request (admin routes)
        $isAdminRequest = $request->is('api/admin/*');
        
        if ($isAdminRequest) {
            // Admin can see all categories (including inactive)
            $query = Category::ordered();
        } else {
            // Public users see only active categories
            $query = Category::active()->ordered();
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Include series count
        if ($request->boolean('with_counts')) {
            $query->withCount(['series' => function ($q) use ($isAdminRequest) {
                if (!$isAdminRequest) {
                    $q->published();
                }
                // Admin can see all series counts
            }]);
        }

        $categories = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'icon' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // Generate slug if not provided
        $validated['slug'] = Str::slug($validated['name']);

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully.',
            'data' => $category,
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category): JsonResponse
    {
        $category->load(['series' => function ($q) {
            $q->published()->withCount('publishedVideos');
        }]);

        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, $id): JsonResponse
    {
        // Find category by ID instead of slug
        $category = Category::findOrFail($id);
        
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'description' => 'nullable|string',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'icon' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // Update slug if name changed
        if ($category->name !== $validated['name']) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully.',
            'data' => $category,
        ]);
    }

    /**
     * Remove the specified category.
     */
    public function destroy($id): JsonResponse
    {
        // Find category by ID instead of slug
        $category = Category::findOrFail($id);
        
        // Check if category has series
        if ($category->series()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category that contains series.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.',
        ]);
    }

    /**
     * Get categories for public display (published series only).
     */
    public function public(): JsonResponse
    {
        $categories = Category::active()
            ->ordered()
            ->withCount(['series' => function ($q) {
                $q->published();
            }])
            ->having('series_count', '>', 0)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }
}