<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    use HasFactory;

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
     * Get a setting value by key
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = static::where('key', $key)->where('is_active', true)->first();
        
        if (!$setting) {
            return $default;
        }

        // Cast value based on type
        switch ($setting->type) {
            case 'boolean':
                return filter_var($setting->value, FILTER_VALIDATE_BOOLEAN);
            case 'number':
                return is_numeric($setting->value) ? (float) $setting->value : $default;
            case 'json':
                return json_decode($setting->value, true) ?? $default;
            default:
                return $setting->value;
        }
    }

    /**
     * Set a setting value by key
     */
    public static function setValue(string $key, $value, string $type = 'text', string $group = 'general', string $label = null, string $description = null)
    {
        $setting = static::firstOrNew(['key' => $key]);
        
        // Convert value to string for storage
        switch ($type) {
            case 'boolean':
                $setting->value = $value ? '1' : '0';
                break;
            case 'json':
                $setting->value = is_string($value) ? $value : json_encode($value);
                break;
            default:
                $setting->value = (string) $value;
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
     * Get all settings grouped by group
     */
    public static function getGrouped()
    {
        return static::where('is_active', true)
            ->orderBy('group')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('group');
    }

    /**
     * Get settings by group
     */
    public static function getByGroup(string $group)
    {
        return static::where('group', $group)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }
}