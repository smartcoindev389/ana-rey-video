<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::getGrouped();
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function getByGroup(string $group)
    {
        $settings = SiteSetting::getByGroup($group);
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function getValue(string $key)
    {
        $value = SiteSetting::getValue($key);
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
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $setting = SiteSetting::setValue(
                $request->key,
                $request->value,
                $request->type ?? 'text',
                $request->group ?? 'general',
                $request->label,
                $request->description
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
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $updatedSettings = [];
            
            foreach ($request->settings as $settingData) {
                $setting = SiteSetting::setValue(
                    $settingData['key'],
                    $settingData['value'],
                    $settingData['type'] ?? 'text',
                    $settingData['group'] ?? 'general',
                    $settingData['label'] ?? null,
                    $settingData['description'] ?? null
                );
                $updatedSettings[] = $setting;
            }

            return response()->json(['success' => true, 'data' => $updatedSettings, 'message' => 'Settings updated successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update settings: ' . $e->getMessage()], 500);
        }
    }

    public function getPublicSettings()
    {
        // Only return public settings (you can add a 'is_public' field later if needed)
        $settings = SiteSetting::where('is_active', true)
            ->whereIn('key', [
                'hero_title',
                'hero_subtitle', 
                'hero_cta_text',
                'hero_cta_button_text',
                'hero_price',
                'hero_disclaimer'
            ])
            ->get()
            ->pluck('value', 'key');

        return response()->json(['success' => true, 'data' => $settings]);
    }
}