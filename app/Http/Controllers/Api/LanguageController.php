<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Translation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

class LanguageController extends Controller
{
    /**
     * Get available languages
     */
    public function languages(): JsonResponse
    {
        $languages = [
            ['code' => 'en', 'name' => 'English', 'native' => 'English', 'flag' => '🇺🇸'],
            ['code' => 'es', 'name' => 'Spanish', 'native' => 'Español', 'flag' => '🇪🇸'],
            ['code' => 'pt', 'name' => 'Portuguese', 'native' => 'Português', 'flag' => '🇵🇹'],
        ];

        return response()->json([
            'success' => true,
            'data' => $languages,
        ]);
    }

    /**
     * Set application locale
     */
    public function setLocale(Request $request): JsonResponse
    {
        $request->validate([
            'locale' => 'required|in:en,es,pt',
        ]);

        $locale = $request->input('locale');
        
        // Set locale for current session
        Session::put('locale', $locale);
        App::setLocale($locale);

        return response()->json([
            'success' => true,
            'message' => 'Language changed successfully',
            'locale' => $locale,
        ]);
    }

    /**
     * Get current locale
     */
    public function getLocale(): JsonResponse
    {
        $locale = Session::get('locale', App::getLocale());

        return response()->json([
            'success' => true,
            'locale' => $locale,
        ]);
    }

    /**
     * Get translations for a specific locale from database
     */
    public function translations(string $locale = null): JsonResponse
    {
        $locale = $locale ?? App::getLocale();
        
        if (!in_array($locale, ['en', 'es', 'pt'])) {
            $locale = 'en';
        }

        // Load translations from database
        $translations = Translation::getByLocale($locale);

        // If no translations in database, fallback to file-based translations
        if (empty($translations)) {
            try {
                $messages = trans('messages');
                if (is_array($messages)) {
                    $translations = $messages;
                }
            } catch (\Exception $e) {
                $translations = [];
            }
        }

        return response()->json([
            'success' => true,
            'locale' => $locale,
            'data' => $translations,
        ]);
    }

    /**
     * Get all translations for admin management
     */
    public function getAllTranslations(): JsonResponse
    {
        $translations = Translation::orderBy('group')
            ->orderBy('key')
            ->orderBy('locale')
            ->get()
            ->groupBy('group');

        return response()->json([
            'success' => true,
            'data' => $translations,
        ]);
    }

    /**
     * Update or create translation
     */
    public function updateTranslation(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string',
            'locale' => 'required|in:en,es,pt',
            'value' => 'required|string',
            'group' => 'nullable|string',
        ]);

        $translation = Translation::updateOrCreateTranslation(
            $request->input('key'),
            $request->input('locale'),
            $request->input('value'),
            $request->input('group')
        );

        return response()->json([
            'success' => true,
            'message' => 'Translation updated successfully',
            'data' => $translation,
        ]);
    }

    /**
     * Bulk update translations
     */
    public function bulkUpdateTranslations(Request $request): JsonResponse
    {
        $request->validate([
            'translations' => 'required|array',
            'translations.*.key' => 'required|string',
            'translations.*.locale' => 'required|in:en,es,pt',
            'translations.*.value' => 'required|string',
            'translations.*.group' => 'nullable|string',
        ]);

        $updated = [];
        foreach ($request->input('translations') as $translationData) {
            $translation = Translation::updateOrCreateTranslation(
                $translationData['key'],
                $translationData['locale'],
                $translationData['value'],
                $translationData['group'] ?? null
            );
            $updated[] = $translation;
        }

        return response()->json([
            'success' => true,
            'message' => count($updated) . ' translations updated successfully',
            'data' => $updated,
        ]);
    }

    /**
     * Delete translation
     */
    public function deleteTranslation(Request $request, int $id): JsonResponse
    {
        $translation = Translation::findOrFail($id);
        $translation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Translation deleted successfully',
        ]);
    }
}

