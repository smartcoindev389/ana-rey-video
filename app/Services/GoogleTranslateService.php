<?php

namespace App\Services;

use Stichoza\GoogleTranslate\GoogleTranslate;

class GoogleTranslateService
{
    private GoogleTranslate $translator;

    public function __construct()
    {
        $this->translator = new GoogleTranslate();
    }

    /**
     * Translate text from source language to target language
     * 
     * @param string $text The text to translate
     * @param string $targetLanguage Target language code (es, pt)
     * @param string $sourceLanguage Source language code (default: en)
     * @return string Translated text
     */
    public function translate(string $text, string $targetLanguage, string $sourceLanguage = 'en'): string
    {
        try {
            // If source and target are the same, return original text
            if ($sourceLanguage === $targetLanguage) {
                return $text;
            }

            // If text is empty, return empty string
            if (empty(trim($text))) {
                return $text;
            }

            $this->translator->setSource($sourceLanguage);
            $this->translator->setTarget($targetLanguage);
            
            $translated = $this->translator->translate($text);
            
            return $translated ?: $text; // Return original if translation fails
        } catch (\Exception $e) {
            \Log::error('Google Translate error: ' . $e->getMessage(), [
                'text' => $text,
                'source' => $sourceLanguage,
                'target' => $targetLanguage,
            ]);
            
            // Return original text on error
            return $text;
        }
    }

    /**
     * Translate text to multiple languages
     * 
     * @param string $text The text to translate
     * @param array $targetLanguages Array of target language codes ['es', 'pt']
     * @param string $sourceLanguage Source language code (default: en)
     * @return array Associative array with language codes as keys ['es' => 'translated text', 'pt' => 'translated text']
     */
    public function translateToMultiple(string $text, array $targetLanguages = ['es', 'pt'], string $sourceLanguage = 'en'): array
    {
        $translations = [];

        foreach ($targetLanguages as $lang) {
            $translations[$lang] = $this->translate($text, $lang, $sourceLanguage);
        }

        return $translations;
    }
}
