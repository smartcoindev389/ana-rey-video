<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HeroBackground;
use App\Services\WebpConversionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class HeroBackgroundController extends Controller
{
    protected $webpService;

    public function __construct(WebpConversionService $webpService)
    {
        $this->webpService = $webpService;
    }

    /**
     * Display a listing of hero backgrounds.
     */
    public function index(Request $request): JsonResponse
    {
        $query = HeroBackground::query();

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('is_active', $request->boolean('status'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'sort_order');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page');
        if ($perPage) {
            $backgrounds = $query->paginate($perPage);
        } else {
            // Return all backgrounds without pagination for admin panel
            $backgrounds = $query->get();
        }

        return response()->json([
            'success' => true,
            'data' => $backgrounds,
        ]);
    }

    /**
     * Store a newly created hero background.
     */
    public function store(Request $request): JsonResponse
    {
        // Check if user is admin
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'required|file|image|mimes:jpeg,png,jpg,webp|max:10240',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'metadata' => 'nullable|array',
        ]);

        try {
            // Upload and convert image to WebP
            $uploadResult = $this->webpService->convertToWebP(
                $request->file('image'),
                'data_section/image'
            );

            if (!$uploadResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload image',
                ], 500);
            }

            // Create hero background record
            $background = HeroBackground::create([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'image_path' => $uploadResult['path'],
                'image_url' => $uploadResult['url'],
                'is_active' => $validated['is_active'] ?? true,
                'sort_order' => $validated['sort_order'] ?? 0,
                'metadata' => $validated['metadata'] ?? [],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Hero background created successfully.',
                'data' => $background,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create hero background: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified hero background.
     */
    public function show(HeroBackground $background): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $background,
        ]);
    }

    /**
     * Update the specified hero background.
     */
    public function update(Request $request, HeroBackground $background): JsonResponse
    {
        // Check if user is admin
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'sometimes|required|file|image|mimes:jpeg,png,jpg,webp|max:10240',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'metadata' => 'nullable|array',
        ]);

        try {
            $updateData = [
                'name' => $validated['name'] ?? $background->name,
                'description' => $validated['description'] ?? $background->description,
                'is_active' => $validated['is_active'] ?? $background->is_active,
                'sort_order' => $validated['sort_order'] ?? $background->sort_order,
                'metadata' => $validated['metadata'] ?? $background->metadata,
            ];

            // Handle new image upload
            if ($request->hasFile('image')) {
                // Delete old image
                if ($background->image_path) {
                    $this->webpService->deleteFile($background->image_path);
                }

                // Upload and convert new image
                $uploadResult = $this->webpService->convertToWebP(
                    $request->file('image'),
                    'data_section/image'
                );

                if ($uploadResult['success']) {
                    $updateData['image_path'] = $uploadResult['path'];
                    $updateData['image_url'] = $uploadResult['url'];
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload new image',
                    ], 500);
                }
            }

            $background->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Hero background updated successfully.',
                'data' => $background,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update hero background: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified hero background.
     */
    public function destroy(HeroBackground $background): JsonResponse
    {
        // Check if user is admin
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        try {
            // Delete image file
            if ($background->image_path) {
                $this->webpService->deleteFile($background->image_path);
            }

            $background->delete();

            return response()->json([
                'success' => true,
                'message' => 'Hero background deleted successfully.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete hero background: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle background status (active/inactive).
     */
    public function toggleStatus(HeroBackground $background): JsonResponse
    {
        // Check if user is admin
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $background->update(['is_active' => !$background->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Background status updated successfully.',
            'data' => $background,
        ]);
    }

    /**
     * Get active hero backgrounds for public display.
     */
    public function public(): JsonResponse
    {
        $backgrounds = HeroBackground::active()->ordered()->get();

        return response()->json([
            'success' => true,
            'data' => $backgrounds,
        ]);
    }
}
