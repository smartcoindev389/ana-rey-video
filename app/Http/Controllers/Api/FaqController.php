<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class FaqController extends Controller
{
    /**
     * Display a listing of FAQs
     */
    public function index(Request $request): JsonResponse
    {
        $query = Faq::query();

        // Filter by category if provided
        if ($request->has('category') && $request->category !== 'all') {
            $query->byCategory($request->category);
        }

        // Filter active FAQs for public access
        if (!$request->has('admin')) {
            $query->active();
        }

        // Order FAQs
        $faqs = $query->ordered()->get();

        // Group by category for better organization
        $groupedFaqs = $faqs->groupBy('category');

        return response()->json([
            'success' => true,
            'data' => $groupedFaqs,
            'categories' => $faqs->pluck('category')->unique()->values()
        ]);
    }

    /**
     * Store a newly created FAQ
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'question' => 'required|string|max:255',
                'answer' => 'required|string',
                'category' => 'required|string|max:50',
                'sort_order' => 'nullable|integer|min:0',
                'is_active' => 'nullable|boolean'
            ]);

            $faq = Faq::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'FAQ created successfully',
                'data' => $faq
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create FAQ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified FAQ
     */
    public function show(Faq $faq): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $faq
        ]);
    }

    /**
     * Update the specified FAQ
     */
    public function update(Request $request, Faq $faq): JsonResponse
    {
        try {
            $validated = $request->validate([
                'question' => 'sometimes|required|string|max:255',
                'answer' => 'sometimes|required|string',
                'category' => 'sometimes|required|string|max:50',
                'sort_order' => 'nullable|integer|min:0',
                'is_active' => 'nullable|boolean'
            ]);

            $faq->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'FAQ updated successfully',
                'data' => $faq
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update FAQ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified FAQ
     */
    public function destroy(Faq $faq): JsonResponse
    {
        try {
            $faq->delete();

            return response()->json([
                'success' => true,
                'message' => 'FAQ deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete FAQ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all FAQs for admin (including inactive)
     */
    public function adminIndex(): JsonResponse
    {
        $faqs = Faq::ordered()->get();

        // Group by category for better organization
        $groupedFaqs = $faqs->groupBy('category');

        return response()->json([
            'success' => true,
            'data' => $groupedFaqs,
            'categories' => $faqs->pluck('category')->unique()->values()
        ]);
    }

    /**
     * Get FAQ categories
     */
    public function categories(): JsonResponse
    {
        $categories = Faq::select('category')
            ->distinct()
            ->where('is_active', true)
            ->orderBy('category')
            ->pluck('category');

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }
}