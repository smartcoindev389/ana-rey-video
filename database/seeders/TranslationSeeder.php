<?php

namespace Database\Seeders;

use App\Models\Translation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class TranslationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing translations
        Translation::truncate();

        $locales = ['en', 'es', 'pt'];
        $basePath = base_path('frontend/src/i18n/locales');
        $langPath = base_path('lang');

        foreach ($locales as $locale) {
            // First, seed from JSON files (frontend i18n)
            $jsonFilePath = "{$basePath}/{$locale}.json";
            
            if (File::exists($jsonFilePath)) {
                $translations = json_decode(File::get($jsonFilePath), true);
                
                if (is_array($translations)) {
                    $this->seedTranslations($translations, $locale);
                }
            }

            // Then, seed from PHP files (backend lang files)
            $phpFilePath = "{$langPath}/{$locale}/messages.php";
            
            if (File::exists($phpFilePath)) {
                $messages = include $phpFilePath;
                
                if (is_array($messages)) {
                    $this->seedTranslations($messages, $locale);
                }
            }
        }

        $this->command->info('Translations seeded successfully!');
    }

    /**
     * Recursively flatten nested array and save translations
     */
    private function seedTranslations(array $data, string $locale, string $prefix = ''): void
    {
        foreach ($data as $key => $value) {
            // If prefix is empty and key contains underscores (flat PHP structure),
            // convert first underscore to dot to create nested structure
            // e.g., 'library_pick_up' becomes 'library.pick_up'
            // e.g., 'library_my_series' becomes 'library.my_series'
            if (empty($prefix) && strpos($key, '_') !== false && strpos($key, '.') === false) {
                // This is a flat key from PHP file, convert first underscore to dot
                $firstUnderscorePos = strpos($key, '_');
                if ($firstUnderscorePos !== false) {
                    // First part is the group (e.g., 'library')
                    $group = substr($key, 0, $firstUnderscorePos);
                    // Rest of the key keeps underscores (e.g., 'pick_up' -> 'pick_up')
                    $nestedKey = substr($key, $firstUnderscorePos + 1);
                    $fullKey = "{$group}.{$nestedKey}";
                } else {
                    $fullKey = $prefix ? "{$prefix}.{$key}" : $key;
                }
            } else {
                // This is already a nested structure (from JSON) or has prefix
                $fullKey = $prefix ? "{$prefix}.{$key}" : $key;
            }
            
            if (is_array($value)) {
                // Recursively process nested arrays
                $this->seedTranslations($value, $locale, $fullKey);
            } else {
                // Save translation
                $group = explode('.', $fullKey)[0] ?? 'common';
                
                Translation::updateOrCreate(
                    [
                        'key' => $fullKey,
                        'locale' => $locale,
                    ],
                    [
                        'value' => $value,
                        'group' => $group,
                    ]
                );
            }
        }
    }
}
