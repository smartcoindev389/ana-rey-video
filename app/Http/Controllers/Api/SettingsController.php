<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $locale = $request->header('Accept-Language') ? 
            substr($request->header('Accept-Language'), 0, 2) : 
            app()->getLocale();
        
        // Normalize locale
        if (!in_array($locale, ['en', 'es', 'pt'])) {
            $locale = 'en';
        }
        
        $settings = SiteSetting::getGrouped($locale);
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function getByGroup(string $group, Request $request)
    {
        $locale = $request->header('Accept-Language') ? 
            substr($request->header('Accept-Language'), 0, 2) : 
            app()->getLocale();
        
        // Normalize locale
        if (!in_array($locale, ['en', 'es', 'pt'])) {
            $locale = 'en';
        }
        
        $settings = SiteSetting::getByGroup($group, $locale);
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function getValue(string $key, Request $request)
    {
        $locale = $request->header('Accept-Language') ? 
            substr($request->header('Accept-Language'), 0, 2) : 
            app()->getLocale();
        
        // Normalize locale
        if (!in_array($locale, ['en', 'es', 'pt'])) {
            $locale = 'en';
        }
        
        $value = SiteSetting::getValue($key, null, $locale);
        return response()->json(['success' => true, 'value' => $value]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized to update settings.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'key' => 'required|string|max:255',
            'value' => 'required',
            'type' => 'string|in:text,number,boolean,json',
            'group' => 'string|max:255',
            'label' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'locale' => 'nullable|in:en,es,pt', // Allow specifying locale for translations
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $locale = $request->input('locale', app()->getLocale());
            
            $setting = SiteSetting::setValue(
                $request->key,
                $request->value,
                $request->type ?? 'text',
                $request->group ?? 'general',
                $request->label,
                $request->description,
                $locale
            );

            return response()->json(['success' => true, 'data' => $setting, 'message' => 'Setting updated successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update setting: ' . $e->getMessage()], 500);
        }
    }

    public function bulkUpdate(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized to update settings.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|max:255',
            'settings.*.value' => 'required',
            'settings.*.type' => 'string|in:text,number,boolean,json',
            'settings.*.group' => 'string|max:255',
            'settings.*.label' => 'nullable|string|max:255',
            'settings.*.description' => 'nullable|string',
            'settings.*.locale' => 'nullable|in:en,es,pt', // Allow specifying locale for translations
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $updatedSettings = [];
            
            foreach ($request->settings as $settingData) {
                $locale = $settingData['locale'] ?? app()->getLocale();
                
                $setting = SiteSetting::setValue(
                    $settingData['key'],
                    $settingData['value'],
                    $settingData['type'] ?? 'text',
                    $settingData['group'] ?? 'general',
                    $settingData['label'] ?? null,
                    $settingData['description'] ?? null,
                    $locale
                );
                $updatedSettings[] = $setting;
            }

            return response()->json(['success' => true, 'data' => $updatedSettings, 'message' => 'Settings updated successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update settings: ' . $e->getMessage()], 500);
        }
    }

    public function getPublicSettings(Request $request)
    {
        // Get locale from request
        $locale = $request->header('Accept-Language') ? 
            substr($request->header('Accept-Language'), 0, 2) : 
            app()->getLocale();
        
        // Normalize locale
        if (!in_array($locale, ['en', 'es', 'pt'])) {
            $locale = 'en';
        }
        
        // Only return public settings (you can add a 'is_public' field later if needed)
        $settings = SiteSetting::where('is_active', true)
            ->whereIn('key', [
                // Hero section settings
                'hero_title',
                'hero_subtitle', 
                'hero_cta_text',
                'hero_cta_button_text',
                'hero_price',
                'hero_disclaimer',
                'hero_background_images',
                // About section settings
                'about_image',
                'about_title',
                'about_description',
                // Testimonial section settings
                'testimonial_title',
                'testimonial_subtitle',
                'homepage_testimonial_ids',
                // Homepage video carousel settings
                'homepage_video_ids',
            ])
            ->get();
        
        // Apply locale to translatable settings
        $result = [];
        foreach ($settings as $setting) {
            $value = $setting->getLocalizedValue($locale);
            
            // Handle type casting for non-translatable fields
            if ($setting->type === 'boolean') {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            } elseif ($setting->type === 'number') {
                $value = is_numeric($value) ? (float) $value : $value;
            } elseif ($setting->type === 'json') {
                $value = json_decode($value, true) ?? $value;
            }
            
            $result[$setting->key] = $value;
        }

        return response()->json(['success' => true, 'data' => $result]);
    }
}