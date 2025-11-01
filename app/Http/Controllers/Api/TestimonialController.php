<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
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
            // Use Feedback model with type 'general_feedback' for testimonials
            $query = Feedback::where('type', 'general_feedback')
                ->where('status', 'resolved') // Treat resolved as approved
                ->with(['user', 'video'])
                ->orderBy('created_at', 'desc');

            // Filter by featured (using metadata or priority)
            if ($request->has('featured') && $request->get('featured') === 'true') {
                $query->where('priority', 'high'); // Use high priority as featured
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
            $query = Feedback::where('type', 'general_feedback')->with(['user', 'video']);

            // Search
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                     ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            }

            // Filter by approved status (resolved = approved)
            if ($request->has('approved')) {
                if ($request->get('approved') === 'true') {
                    $query->where('status', 'resolved');
                } else {
                    $query->where('status', '!=', 'resolved');
                }
            }

            // Filter by featured (high priority = featured)
            if ($request->has('featured')) {
                if ($request->get('featured') === 'true') {
                    $query->where('priority', 'high');
                } else {
                    $query->where('priority', '!=', 'high');
                }
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
                'description' => 'required|string',
                'rating' => 'nullable|integer|min:1|max:5',
                'user_id' => 'nullable|exists:users,id',
                'video_id' => 'nullable|exists:videos,id',
                'priority' => 'nullable|in:low,medium,high,urgent',
                'status' => 'nullable|in:new,reviewed,in_progress,resolved,rejected',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            $validated['type'] = 'general_feedback';
            $validated['status'] = $validated['status'] ?? 'new';
            $validated['priority'] = $validated['priority'] ?? 'medium';

            $testimonial = Feedback::create($validated);
            $testimonial->load(['user', 'video']);

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
            $testimonial = Feedback::where('type', 'general_feedback')
                ->with(['user', 'video'])
                ->findOrFail($id);

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
            $testimonial = Feedback::where('type', 'general_feedback')->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'description' => 'sometimes|required|string',
                'rating' => 'sometimes|required|integer|min:1|max:5',
                'user_id' => 'nullable|exists:users,id',
                'video_id' => 'nullable|exists:videos,id',
                'priority' => 'sometimes|in:low,medium,high,urgent',
                'status' => 'sometimes|in:new,reviewed,in_progress,resolved,rejected',
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
            $testimonial = Feedback::where('type', 'general_feedback')->findOrFail($id);
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
            $testimonial = Feedback::where('type', 'general_feedback')->findOrFail($id);
            // Toggle between resolved (approved) and reviewed (pending)
            if ($testimonial->status === 'resolved') {
                $testimonial->status = 'reviewed';
            } else {
                $testimonial->status = 'resolved';
            }
            $testimonial->save();

            return response()->json([
                'success' => true,
                'data' => $testimonial,
                'message' => 'Testimonial ' . ($testimonial->status === 'resolved' ? 'approved' : 'unapproved') . ' successfully',
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
            $testimonial = Feedback::where('type', 'general_feedback')->findOrFail($id);
            // Toggle featured using priority (high = featured)
            if ($testimonial->priority === 'high') {
                $testimonial->priority = 'medium';
            } else {
                $testimonial->priority = 'high';
            }
            $testimonial->save();

            return response()->json([
                'success' => true,
                'data' => $testimonial,
                'message' => 'Testimonial ' . ($testimonial->priority === 'high' ? 'featured' : 'unfeatured') . ' successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle featured: ' . $e->getMessage(),
            ], 500);
        }
    }
}
