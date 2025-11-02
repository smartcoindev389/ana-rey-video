<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Translation extends Model
{
    protected $fillable = [
        'key',
        'locale',
        'value',
        'group',
    ];

    /**
     * Get translations grouped by group for a specific locale
     */
    public static function getByLocale(string $locale): array
    {
        $translations = self::where('locale', $locale)->get();
        
        $result = [];
        foreach ($translations as $translation) {
            $keys = explode('.', $translation->key);
            $current = &$result;
            
            foreach ($keys as $key) {
                if (!isset($current[$key])) {
                    $current[$key] = [];
                }
                $current = &$current[$key];
            }
            
            $current = $translation->value;
        }
        
        return $result;
    }

    /**
     * Get all translations as flat array with dot notation keys
     */
    public static function getFlatByLocale(string $locale): array
    {
        return self::where('locale', $locale)
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * Update or create translation
     */
    public static function updateOrCreateTranslation(
        string $key,
        string $locale,
        string $value,
        ?string $group = null
    ): self {
        return self::updateOrCreate(
            [
                'key' => $key,
                'locale' => $locale,
            ],
            [
                'value' => $value,
                'group' => $group ?? explode('.', $key)[0] ?? 'common',
            ]
        );
    }
}
