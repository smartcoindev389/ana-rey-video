<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TestimonialController extends Controller
{
    /**
     * Display a listing of approved testimonials (public).
     */
    public function public(Request $request): JsonResponse
    {
        try {
            $query = Testimonial::approved()->orderBy('sort_order', 'asc')->orderBy('created_at', 'desc');

            // Filter by featured
            if ($request->has('featured') && $request->get('featured') === 'true') {
                $query->featured();
            }

            // Limit results if specified
            $limit = $request->get('limit');
            if ($limit) {
                $testimonials = $query->limit($limit)->get();
            } else {
                $testimonials = $query->get();
            }

            return response()->json([
                'success' => true,
                'data' => $testimonials,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch testimonials: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display a listing of the resource (admin).
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Testimonial::query()->with(['user', 'video']);

            // Search
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%")
                        ->orWhere('role', 'like', "%{$search}%");
                });
            }

            // Filter by approved status
            if ($request->has('approved')) {
                $query->where('is_approved', $request->get('approved') === 'true');
            }

            // Filter by featured
            if ($request->has('featured')) {
                $query->where('is_featured', $request->get('featured') === 'true');
            }

            // Sort
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate
            $perPage = $request->get('per_page', 15);
            $testimonials = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $testimonials,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch testimonials: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'role' => 'nullable|string|max:255',
                'company' => 'nullable|string|max:255',
                'avatar' => 'nullable|string',
                'content' => 'required|string',
                'rating' => 'required|integer|min:1|max:5',
                'user_id' => 'nullable|exists:users,id',
                'video_id' => 'nullable|exists:videos,id',
                'is_approved' => 'sometimes|boolean',
                'is_featured' => 'sometimes|boolean',
                'sort_order' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $testimonial = Testimonial::create($validator->validated());

            return response()->json([
                'success' => true,
                'data' => $testimonial,
                'message' => 'Testimonial created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create testimonial: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $testimonial = Testimonial::with(['user', 'video'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $testimonial,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Testimonial not found',
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $testimonial = Testimonial::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'role' => 'nullable|string|max:255',
                'company' => 'nullable|string|max:255',
                'avatar' => 'nullable|string',
                'content' => 'sometimes|required|string',
                'rating' => 'sometimes|required|integer|min:1|max:5',
                'user_id' => 'nullable|exists:users,id',
                'video_id' => 'nullable|exists:videos,id',
                'is_approved' => 'sometimes|boolean',
                'is_featured' => 'sometimes|boolean',
                'sort_order' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $testimonial->update($validator->validated());

            return response()->json([
                'success' => true,
                'data' => $testimonial->fresh(['user', 'video']),
                'message' => 'Testimonial updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update testimonial: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $testimonial = Testimonial::findOrFail($id);
            $testimonial->delete();

            return response()->json([
                'success' => true,
                'message' => 'Testimonial deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete testimonial: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle approval status.
     */
    public function toggleApproval(int $id): JsonResponse
    {
        try {
            $testimonial = Testimonial::findOrFail($id);
            $testimonial->is_approved = !$testimonial->is_approved;
            $testimonial->save();

            return response()->json([
                'success' => true,
                'data' => $testimonial,
                'message' => 'Testimonial ' . ($testimonial->is_approved ? 'approved' : 'unapproved') . ' successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle approval: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle featured status.
     */
    public function toggleFeatured(int $id): JsonResponse
    {
        try {
            $testimonial = Testimonial::findOrFail($id);
            $testimonial->is_featured = !$testimonial->is_featured;
            $testimonial->save();

            return response()->json([
                'success' => true,
                'data' => $testimonial,
                'message' => 'Testimonial ' . ($testimonial->is_featured ? 'featured' : 'unfeatured') . ' successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle featured: ' . $e->getMessage(),
            ], 500);
        }
    }
}
