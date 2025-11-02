<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentTranslation extends Model
{
    protected $fillable = [
        'translatable_type',
        'translatable_id',
        'locale',
        'field',
        'value',
    ];

    /**
     * Get the parent translatable model.
     */
    public function translatable()
    {
        return $this->morphTo();
    }

    /**
     * Get translation for a specific model, locale, and field
     */
    public static function getTranslation(string $modelType, int $modelId, string $locale, string $field): ?string
    {
        $translation = self::where('translatable_type', $modelType)
            ->where('translatable_id', $modelId)
            ->where('locale', $locale)
            ->where('field', $field)
            ->first();

        return $translation ? $translation->value : null;
    }

    /**
     * Get all translations for a model and locale
     */
    public static function getTranslations(string $modelType, int $modelId, string $locale): array
    {
        return self::where('translatable_type', $modelType)
            ->where('translatable_id', $modelId)
            ->where('locale', $locale)
            ->pluck('value', 'field')
            ->toArray();
    }

    /**
     * Save or update translation
     */
    public static function setTranslation(string $modelType, int $modelId, string $locale, string $field, string $value): self
    {
        return self::updateOrCreate(
            [
                'translatable_type' => $modelType,
                'translatable_id' => $modelId,
                'locale' => $locale,
                'field' => $field,
            ],
            [
                'value' => $value,
            ]
        );
    }
}