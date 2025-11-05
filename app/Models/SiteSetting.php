<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTranslations;

class SiteSetting extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
        'description',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get translatable fields for this model
     */
    protected function getTranslatableFields(): array
    {
        // Define which setting keys are translatable (text content)
        $translatableKeys = [
            'hero_title',
            'hero_subtitle',
            'hero_cta_text',
            'hero_cta_button_text',
            'hero_disclaimer',
            'about_title',
            'about_description',
            'testimonial_title',
            'testimonial_subtitle',
        ];

        // Only return 'value' as translatable if this setting's key is in the list
        if (in_array($this->key, $translatableKeys)) {
            return ['value'];
        }

        return [];
    }

    /**
     * Get a setting value by key (with locale support)
     */
    public static function getValue(string $key, $default = null, ?string $locale = null)
    {
        $setting = static::where('key', $key)->where('is_active', true)->first();
        
        if (!$setting) {
            return $default;
        }

        $locale = $locale ?? app()->getLocale();
        
        // Get translated value if locale is not English and field is translatable
        $translatableKeys = [
            'hero_title',
            'hero_subtitle',
            'hero_cta_text',
            'hero_cta_button_text',
            'hero_disclaimer',
            'about_title',
            'about_description',
            'testimonial_title',
            'testimonial_subtitle',
        ];
        
        $rawValue = $setting->value;
        if ($locale !== 'en' && in_array($key, $translatableKeys)) {
            $translation = $setting->getTranslation('value', $locale);
            if ($translation) {
                $rawValue = $translation;
            }
        }

        // Cast value based on type
        switch ($setting->type) {
            case 'boolean':
                return filter_var($rawValue, FILTER_VALIDATE_BOOLEAN);
            case 'number':
                return is_numeric($rawValue) ? (float) $rawValue : $default;
            case 'json':
                return json_decode($rawValue, true) ?? $default;
            default:
                return $rawValue;
        }
    }

    /**
     * Set a setting value by key (with locale support)
     */
    public static function setValue(string $key, $value, string $type = 'text', string $group = 'general', string $label = null, string $description = null, ?string $locale = null)
    {
        $setting = static::firstOrNew(['key' => $key]);
        
        $locale = $locale ?? app()->getLocale();
        
        // Convert value to string for storage
        $stringValue = null;
        switch ($type) {
            case 'boolean':
                $stringValue = $value ? '1' : '0';
                break;
            case 'json':
                $stringValue = is_string($value) ? $value : json_encode($value);
                break;
            default:
                $stringValue = (string) $value;
        }

        // If locale is English or setting is not translatable, save to main value field
        // Otherwise, save as translation
        $translatableKeys = [
            'hero_title',
            'hero_subtitle',
            'hero_cta_text',
            'hero_cta_button_text',
            'hero_disclaimer',
            'about_title',
            'about_description',
            'testimonial_title',
            'testimonial_subtitle',
        ];

        if ($locale === 'en' || !in_array($key, $translatableKeys)) {
            // Save to main value field
            $setting->value = $stringValue;
        } else {
            // Save translation, but also ensure English value exists
            if (!$setting->exists || !$setting->value) {
                $setting->value = $stringValue; // Set English as default
            }
            $setting->setTranslation('value', $locale, $stringValue);
        }

        $setting->type = $type;
        $setting->group = $group;
        $setting->label = $label ?? ucwords(str_replace('_', ' ', $key));
        $setting->description = $description;
        $setting->is_active = true;
        
        $setting->save();
        
        return $setting;
    }

    /**
     * Get all settings grouped by group (with locale support)
     */
    public static function getGrouped(?string $locale = null)
    {
        $locale = $locale ?? app()->getLocale();
        $settings = static::where('is_active', true)
            ->orderBy('group')
            ->orderBy('sort_order')
            ->get();
        
        // Apply locale to each setting
        foreach ($settings as $setting) {
            $translatableKeys = [
                'hero_title',
                'hero_subtitle',
                'hero_cta_text',
                'hero_cta_button_text',
                'hero_disclaimer',
                'about_title',
                'about_description',
                'testimonial_title',
                'testimonial_subtitle',
            ];
            
            if ($locale !== 'en' && in_array($setting->key, $translatableKeys)) {
                $translation = $setting->getTranslation('value', $locale);
                if ($translation) {
                    $setting->value = $translation;
                }
            }
        }
        
        return $settings->groupBy('group');
    }

    /**
     * Get settings by group (with locale support)
     */
    public static function getByGroup(string $group, ?string $locale = null)
    {
        $locale = $locale ?? app()->getLocale();
        $settings = static::where('group', $group)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
        
        // Apply locale to each setting
        foreach ($settings as $setting) {
            $translatableKeys = [
                'hero_title',
                'hero_subtitle',
                'hero_cta_text',
                'hero_cta_button_text',
                'hero_disclaimer',
                'about_title',
                'about_description',
                'testimonial_title',
                'testimonial_subtitle',
            ];
            
            if ($locale !== 'en' && in_array($setting->key, $translatableKeys)) {
                $translation = $setting->getTranslation('value', $locale);
                if ($translation) {
                    $setting->value = $translation;
                }
            }
        }
        
        return $settings;
    }

    /**
     * Get localized value attribute
     */
    public function getLocalizedValue(?string $locale = null): ?string
    {
        $locale = $locale ?? app()->getLocale();
        
        $translatableKeys = [
            'hero_title',
            'hero_subtitle',
            'hero_cta_text',
            'hero_cta_button_text',
            'hero_disclaimer',
            'about_title',
            'about_description',
            'testimonial_title',
            'testimonial_subtitle',
        ];
        
        if ($locale === 'en' || !in_array($this->key, $translatableKeys)) {
            return $this->value;
        }
        
        $translation = $this->getTranslation('value', $locale);
        return $translation ?: $this->value;
    }
}