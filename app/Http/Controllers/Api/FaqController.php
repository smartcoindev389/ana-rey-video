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
            $locale = $request->input('locale', app()->getLocale());
            
            $validated = $request->validate([
                'question' => 'required|string|max:255',
                'answer' => 'required|string',
                'category' => 'required|string|max:50',
                'sort_order' => 'nullable|integer|min:0',
                'is_active' => 'nullable|boolean',
                'locale' => 'nullable|in:en,es,pt', // Allow locale parameter
            ]);

            // If locale is English, create normally (auto-translate will handle translations)
            // If locale is not English, save English version first, then add translation
            if ($locale === 'en') {
                $faq = Faq::create($validated);
            } else {
                // For non-English locales, we need to save English first, then add translation
                // But we don't have English values, so we'll save the provided values as English
                // and then add them as translations
                $faq = Faq::create([
                    'question' => $validated['question'], // Save as English (will be overwritten with translation)
                    'answer' => $validated['answer'],
                    'category' => $validated['category'],
                    'sort_order' => $validated['sort_order'] ?? 0,
                    'is_active' => $validated['is_active'] ?? true,
                ]);
                
                // Now save as translations for the specified locale
                $faq->setTranslation('question', $locale, $validated['question']);
                $faq->setTranslation('answer', $locale, $validated['answer']);
                
                // Set English values to empty or placeholder (since we don't have them)
                // Actually, let's keep the values as-is since they're in the requested locale
                // Admin should create FAQs in English first, then translate
            }

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
            $locale = $request->input('locale', app()->getLocale());
            
            $validated = $request->validate([
                'question' => 'sometimes|required|string|max:255',
                'answer' => 'sometimes|required|string',
                'category' => 'sometimes|required|string|max:50',
                'sort_order' => 'nullable|integer|min:0',
                'is_active' => 'nullable|boolean',
                'locale' => 'nullable|in:en,es,pt', // Allow locale parameter
            ]);

            // If locale is English, update main fields
            if ($locale === 'en') {
                $faq->update($validated);
            } else {
                // For other locales, save translations
                if (isset($validated['question'])) {
                    $faq->setTranslation('question', $locale, $validated['question']);
                }
                if (isset($validated['answer'])) {
                    $faq->setTranslation('answer', $locale, $validated['answer']);
                }
                
                // Update non-translatable fields
                $nonTranslatableFields = ['category', 'sort_order', 'is_active'];
                $fieldsToUpdate = array_intersect_key($validated, array_flip($nonTranslatableFields));
                if (!empty($fieldsToUpdate)) {
                    $faq->update($fieldsToUpdate);
                }
                
                // Refresh to get translated values
                $faq->refresh();
            }

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