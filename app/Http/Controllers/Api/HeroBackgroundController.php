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

        // Normalize inputs before validation
        if (!$request->filled('name')) {
            $request->merge(['name' => $request->input('title', 'Hero Background')]);
        }

        // Normalize is_active from FormData (which sends strings) to boolean
        if ($request->has('is_active')) {
            $isActiveValue = $request->input('is_active');
            // Convert empty string to null for nullable validation
            if ($isActiveValue === '' || $isActiveValue === null) {
                $request->merge(['is_active' => null]);
            } else {
                $request->merge(['is_active' => $request->boolean('is_active')]);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            // We'll validate the file presence manually to allow alternate keys like image_file
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'metadata' => 'nullable|array',
        ]);

        try {
            // Determine which file key is present
            $file = null;
            if ($request->hasFile('image')) {
                $file = $request->file('image');
            } elseif ($request->hasFile('image_file')) {
                $file = $request->file('image_file');
            }

            if (!$file) {
                return response()->json([
                    'success' => false,
                    'message' => 'No image file provided. Please upload a file under "image".',
                ], 422);
            }

            // Upload and convert image to WebP
            $uploadResult = $this->webpService->convertToWebP(
                $file,
                'data_section/image'
            );

            if (!$uploadResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload image',
                ], 500);
            }

            // Check if hero background exists for this sort_order (slot index)
            $sortOrder = $validated['sort_order'] ?? 0;
            $background = HeroBackground::where('sort_order', $sortOrder)->first();

            if ($background) {
                // Update existing hero background
                // Delete old image if exists
                if ($background->image_path) {
                    $this->webpService->deleteFile($background->image_path);
                }

                $background->update([
                    'name' => $validated['name'] ?? $background->name,
                    'description' => $validated['description'] ?? $background->description,
                    'image_path' => $uploadResult['path'] ?? null,
                    'image_url' => $uploadResult['url'] ?? null,
                    'is_active' => isset($validated['is_active']) ? $validated['is_active'] : ($background->is_active ?? true),
                    'metadata' => $validated['metadata'] ?? $background->metadata,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Hero background updated successfully.',
                    'data' => $background,
                ]);
            } else {
                // Create new hero background record only if it doesn't exist
                $background = HeroBackground::create([
                    'name' => $validated['name'] ?? 'Hero Background',
                    'description' => $validated['description'] ?? null,
                    'image_path' => $uploadResult['path'] ?? null,
                    'image_url' => $uploadResult['url'] ?? null,
                    'is_active' => $validated['is_active'] ?? true,
                    'sort_order' => $sortOrder,
                    'metadata' => $validated['metadata'] ?? [],
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Hero background created successfully.',
                    'data' => $background,
                ], 201);
            }

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

        // Normalize is_active from FormData (which sends strings) to boolean
        if ($request->has('is_active')) {
            $isActiveValue = $request->input('is_active');
            // Convert empty string to null for nullable validation
            if ($isActiveValue === '' || $isActiveValue === null) {
                $request->merge(['is_active' => null]);
            } else {
                $request->merge(['is_active' => $request->boolean('is_active')]);
            }
        }

        // Accept either 'image' or 'image_file' during update
        $imageRuleKey = $request->hasFile('image') || $request->hasFile('image_file');
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            // validate file only if present under either key
            'image' => $imageRuleKey ? 'sometimes|file|image|mimes:jpeg,png,jpg,webp|max:10240' : 'nullable',
            'image_file' => $imageRuleKey ? 'sometimes|file|image|mimes:jpeg,png,jpg,webp|max:10240' : 'nullable',
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

            // Handle new image upload (support 'image' and 'image_file')
            if ($request->hasFile('image') || $request->hasFile('image_file')) {
                // Delete old image
                if ($background->image_path) {
                    $this->webpService->deleteFile($background->image_path);
                }

                // Upload and convert new image
                $file = $request->file('image') ?? $request->file('image_file');
                $uploadResult = $this->webpService->convertToWebP($file, 'data_section/image');

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
