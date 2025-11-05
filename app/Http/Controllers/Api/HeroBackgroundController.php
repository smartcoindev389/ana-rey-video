<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HeroBackground;
use App\Services\WebpConversionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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

            // Check if hero background exists for this sort_order (slot index)
            $sortOrder = $validated['sort_order'] ?? 0;
            $background = HeroBackground::where('sort_order', $sortOrder)->first();

            if ($background) {
                // Update existing hero background
                // Get old image path BEFORE updating
                $oldImagePath = $background->getRawOriginal('image_path');
                Log::info('Hero background update: Found existing background', [
                    'background_id' => $background->id,
                    'sort_order' => $sortOrder,
                    'old_image_path' => $oldImagePath
                ]);
                
                // Upload new image first
                $uploadResult = $this->webpService->convertToWebP(
                    $file,
                    'data_section/image'
                );

                if (!$uploadResult['success']) {
                    Log::error('Hero background update: Upload failed', [
                        'background_id' => $background->id
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload image',
                    ], 500);
                }

                Log::info('Hero background update: Upload successful', [
                    'background_id' => $background->id,
                    'new_image_path' => $uploadResult['path'],
                    'new_image_url' => $uploadResult['url']
                ]);

                // Delete old image only after successful upload
                if ($oldImagePath && !empty($oldImagePath)) {
                    $deleted = $this->webpService->deleteFile($oldImagePath);
                    if (!$deleted) {
                        // Log warning but don't fail the update
                        Log::warning('Failed to delete old hero background image', [
                            'background_id' => $background->id,
                            'old_path' => $oldImagePath,
                            'new_path' => $uploadResult['path']
                        ]);
                    } else {
                        Log::info('Hero background update: Old file deleted', [
                            'background_id' => $background->id,
                            'old_path' => $oldImagePath
                        ]);
                    }
                }

                $updateData = [
                    'name' => $validated['name'] ?? $background->name,
                    'description' => $validated['description'] ?? $background->description,
                    'image_path' => $uploadResult['path'],
                    'image_url' => $uploadResult['url'],
                    'is_active' => isset($validated['is_active']) ? $validated['is_active'] : ($background->is_active ?? true),
                    'metadata' => $validated['metadata'] ?? $background->metadata,
                ];

                Log::info('Hero background update: Attempting database update', [
                    'background_id' => $background->id,
                    'update_data' => $updateData
                ]);

                $updated = $background->update($updateData);
                
                if (!$updated) {
                    Log::error('Hero background update: Database update failed', [
                        'background_id' => $background->id
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to update hero background in database',
                    ], 500);
                }

                // Refresh to get latest data
                $background->refresh();

                Log::info('Hero background update: Successfully updated', [
                    'background_id' => $background->id,
                    'final_image_path' => $background->getRawOriginal('image_path'),
                    'final_image_url' => $background->getRawOriginal('image_url')
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Hero background updated successfully.',
                    'data' => $background,
                ]);
            } else {
                // Upload and convert image to WebP for new record
                $uploadResult = $this->webpService->convertToWebP(
                    $file,
                    'data_section/image'
                );

                if (!$uploadResult['success']) {
                    Log::error('Hero background create: Upload failed');
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload image',
                    ], 500);
                }

                Log::info('Hero background create: Upload successful', [
                    'image_path' => $uploadResult['path'],
                    'image_url' => $uploadResult['url']
                ]);
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

                Log::info('Hero background create: Successfully created', [
                    'background_id' => $background->id,
                    'image_path' => $background->getRawOriginal('image_path'),
                    'image_url' => $background->getRawOriginal('image_url')
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
            // If background doesn't exist (no ID), try to find by sort_order or create new
            if (!$background->id) {
                $sortOrder = isset($validated['sort_order']) ? (int)$validated['sort_order'] : null;
                if ($sortOrder !== null) {
                    $existingBackground = HeroBackground::where('sort_order', $sortOrder)->first();
                    if ($existingBackground) {
                        $background = $existingBackground;
                        Log::info('Hero background update: Found existing background by sort_order', [
                            'background_id' => $background->id,
                            'sort_order' => $sortOrder
                        ]);
                    }
                }
                
                // If still not found and we have sort_order and file, create new
                if (!$background->id && $sortOrder !== null && ($request->hasFile('image') || $request->hasFile('image_file'))) {
                    Log::info('Hero background update: Background not found, redirecting to create', [
                        'sort_order' => $sortOrder
                    ]);
                    // Use store method logic
                    return $this->store($request);
                } else if (!$background->id) {
                    Log::error('Hero background update: Background not found', [
                        'sort_order' => $sortOrder
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Hero background not found and cannot create without sort_order',
                    ], 404);
                }
            }

            $updateData = [
                'name' => isset($validated['name']) ? $validated['name'] : $background->name,
                'description' => isset($validated['description']) ? $validated['description'] : $background->description,
                'is_active' => isset($validated['is_active']) ? $validated['is_active'] : $background->is_active,
                'sort_order' => isset($validated['sort_order']) ? (int)$validated['sort_order'] : $background->sort_order,
                'metadata' => isset($validated['metadata']) ? $validated['metadata'] : $background->metadata,
            ];

            // Handle new image upload (support 'image' and 'image_file')
            if ($request->hasFile('image') || $request->hasFile('image_file')) {
                // Get old image path BEFORE updating (refresh to get current value)
                $oldImagePath = $background->getRawOriginal('image_path');
                
                Log::info('Hero background update: Starting file upload', [
                    'background_id' => $background->id,
                    'old_image_path' => $oldImagePath
                ]);
                
                // Upload and convert new image
                $file = $request->file('image') ?? $request->file('image_file');
                $uploadResult = $this->webpService->convertToWebP($file, 'data_section/image');

                if ($uploadResult['success']) {
                    Log::info('Hero background update: File upload successful', [
                        'background_id' => $background->id,
                        'new_image_path' => $uploadResult['path'],
                        'new_image_url' => $uploadResult['url']
                    ]);

                    // Only delete old file if new upload succeeded and old file exists
                    if ($oldImagePath && !empty($oldImagePath) && $oldImagePath !== $uploadResult['path']) {
                        $deleted = $this->webpService->deleteFile($oldImagePath);
                        if (!$deleted) {
                            // Log warning but don't fail the update
                            Log::warning('Failed to delete old hero background image', [
                                'background_id' => $background->id,
                                'old_path' => $oldImagePath,
                                'new_path' => $uploadResult['path']
                            ]);
                        } else {
                            Log::info('Hero background update: Old file deleted', [
                                'background_id' => $background->id,
                                'old_path' => $oldImagePath
                            ]);
                        }
                    }
                    
                    $updateData['image_path'] = $uploadResult['path'];
                    $updateData['image_url'] = $uploadResult['url'];
                } else {
                    Log::error('Hero background update: File upload failed', [
                        'background_id' => $background->id
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload new image',
                    ], 500);
                }
            }

            Log::info('Hero background update: Attempting database update', [
                'background_id' => $background->id,
                'update_data' => $updateData
            ]);

            $updated = $background->update($updateData);
            
            if (!$updated) {
                Log::error('Hero background update: Database update failed', [
                    'background_id' => $background->id,
                    'update_data' => $updateData
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update hero background in database',
                ], 500);
            }

            // Refresh to get latest data
            $background->refresh();

            Log::info('Hero background update: Successfully updated', [
                'background_id' => $background->id,
                'final_image_path' => $background->getRawOriginal('image_path'),
                'final_image_url' => $background->getRawOriginal('image_url')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Hero background updated successfully.',
                'data' => $background,
            ]);

        } catch (\Exception $e) {
            Log::error('Hero background update: Exception occurred', [
                'background_id' => $background->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
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
            // Get old image path BEFORE deleting
            $oldImagePath = $background->getRawOriginal('image_path');
            
            // Delete image file
            if ($oldImagePath && !empty($oldImagePath)) {
                $deleted = $this->webpService->deleteFile($oldImagePath);
                if (!$deleted) {
                    Log::warning('Failed to delete hero background image file', [
                        'background_id' => $background->id,
                        'path' => $oldImagePath
                    ]);
                }
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
