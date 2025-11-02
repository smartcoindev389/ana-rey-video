<?php

namespace App\Traits;

use App\Models\ContentTranslation;
use App\Services\GoogleTranslateService;

trait HasTranslations
{
    /**
     * Get translation for a field in a specific locale
     */
    public function getTranslation(string $field, string $locale): ?string
    {
        $translation = ContentTranslation::getTranslation(
            static::class,
            $this->id,
            $locale,
            $field
        );

        // Return translation if exists, otherwise return null (caller should use raw value as fallback)
        return $translation;
    }

    /**
     * Get all translations for this model in a specific locale
     */
    public function getTranslations(string $locale): array
    {
        return ContentTranslation::getTranslations(
            static::class,
            $this->id,
            $locale
        );
    }

    /**
     * Set translation for a field in a specific locale
     */
    public function setTranslation(string $field, string $locale, string $value): void
    {
        ContentTranslation::setTranslation(
            static::class,
            $this->id,
            $locale,
            $field,
            $value
        );
    }

    /**
     * Auto-translate content to target languages
     */
    public function autoTranslate(array $fields, array $targetLanguages = ['es', 'pt'], string $sourceLanguage = 'en'): void
    {
        $translateService = new GoogleTranslateService();

        foreach ($fields as $field) {
            // Use raw attribute to get original English value, not translated
            $originalText = $this->getAttributes()[$field] ?? $this->getOriginal($field);
            
            // Skip if field is empty
            if (empty($originalText)) {
                continue;
            }

            // Translate to all target languages
            $translations = $translateService->translateToMultiple($originalText, $targetLanguages, $sourceLanguage);

            // Save translations
            foreach ($translations as $lang => $translatedText) {
                $this->setTranslation($field, $lang, $translatedText);
            }
        }
    }

    /**
     * Get translatable fields for this model
     */
    protected function getTranslatableFields(): array
    {
        // Override this method in each model to return translatable field names
        return [];
    }

    /**
     * Boot the trait
     */
    public static function bootHasTranslations(): void
    {
        // Auto-translate on create
        static::created(function ($model) {
            if (method_exists($model, 'getTranslatableFields')) {
                $translatableFields = $model->getTranslatableFields();
                if (!empty($translatableFields)) {
                    $model->autoTranslate($translatableFields);
                }
            }
        });

        // Auto-translate on update if translatable fields changed
        static::updated(function ($model) {
            if (method_exists($model, 'getTranslatableFields')) {
                $translatableFields = $model->getTranslatableFields();
                $changedFields = array_intersect($translatableFields, array_keys($model->getChanges()));
                
                if (!empty($changedFields)) {
                    $model->autoTranslate($changedFields);
                }
            }
        });

        // Delete translations when model is deleted
        static::deleting(function ($model) {
            ContentTranslation::where('translatable_type', get_class($model))
                ->where('translatable_id', $model->id)
                ->delete();
        });
    }

    /**
     * Get localized attribute (use translation if available, fallback to original)
     */
    public function getLocalizedAttribute(string $field, ?string $locale = null): ?string
    {
        $locale = $locale ?? app()->getLocale();
        
        // If locale is English, return original
        if ($locale === 'en') {
            return $this->getAttribute($field);
        }

        // Get translation
        $translation = $this->getTranslation($field, $locale);
        
        // If translation exists, return it; otherwise return original
        return $translation ?: $this->getAttribute($field);
    }
}
