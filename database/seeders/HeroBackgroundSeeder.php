<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\HeroBackground;

class HeroBackgroundSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $backgrounds = [
            [
                'name' => 'Hero Background 1',
                'description' => 'Main hero background image',
                'image_path' => 'data_section/image/cover1.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover1.webp',
                'is_active' => true,
                'sort_order' => 1,
                'metadata' => ['alt' => 'Hero Background 1', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 2',
                'description' => 'Alternative hero background',
                'image_path' => 'data_section/image/cover2.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover2.webp',
                'is_active' => true,
                'sort_order' => 2,
                'metadata' => ['alt' => 'Hero Background 2', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 3',
                'description' => 'Third hero background',
                'image_path' => 'data_section/image/cover3.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover3.webp',
                'is_active' => true,
                'sort_order' => 3,
                'metadata' => ['alt' => 'Hero Background 3', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 4',
                'description' => 'Fourth hero background',
                'image_path' => 'data_section/image/cover4.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover4.webp',
                'is_active' => true,
                'sort_order' => 4,
                'metadata' => ['alt' => 'Hero Background 4', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 5',
                'description' => 'Fifth hero background',
                'image_path' => 'data_section/image/cover5.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover5.webp',
                'is_active' => true,
                'sort_order' => 5,
                'metadata' => ['alt' => 'Hero Background 5', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 6',
                'description' => 'Sixth hero background',
                'image_path' => 'data_section/image/cover6.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover6.webp',
                'is_active' => true,
                'sort_order' => 6,
                'metadata' => ['alt' => 'Hero Background 6', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 7',
                'description' => 'Seventh hero background',
                'image_path' => 'data_section/image/cover7.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover7.webp',
                'is_active' => true,
                'sort_order' => 7,
                'metadata' => ['alt' => 'Hero Background 7', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 8',
                'description' => 'Eighth hero background',
                'image_path' => 'data_section/image/cover8.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover8.webp',
                'is_active' => true,
                'sort_order' => 8,
                'metadata' => ['alt' => 'Hero Background 8', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 9',
                'description' => 'Ninth hero background',
                'image_path' => 'data_section/image/cover1.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover1.webp',
                'is_active' => true,
                'sort_order' => 9,
                'metadata' => ['alt' => 'Hero Background 9', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 10',
                'description' => 'Tenth hero background',
                'image_path' => 'data_section/image/cover2.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover2.webp',
                'is_active' => true,
                'sort_order' => 10,
                'metadata' => ['alt' => 'Hero Background 10', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 11',
                'description' => 'Eleventh hero background',
                'image_path' => 'data_section/image/cover3.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover3.webp',
                'is_active' => true,
                'sort_order' => 11,
                'metadata' => ['alt' => 'Hero Background 11', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 12',
                'description' => 'Twelfth hero background',
                'image_path' => 'data_section/image/cover4.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover4.webp',
                'is_active' => true,
                'sort_order' => 12,
                'metadata' => ['alt' => 'Hero Background 12', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 13',
                'description' => 'Thirteenth hero background',
                'image_path' => 'data_section/image/cover5.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover5.webp',
                'is_active' => true,
                'sort_order' => 13,
                'metadata' => ['alt' => 'Hero Background 13', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 14',
                'description' => 'Fourteenth hero background',
                'image_path' => 'data_section/image/cover6.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover6.webp',
                'is_active' => true,
                'sort_order' => 14,
                'metadata' => ['alt' => 'Hero Background 14', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 15',
                'description' => 'Fifteenth hero background',
                'image_path' => 'data_section/image/cover7.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover7.webp',
                'is_active' => true,
                'sort_order' => 15,
                'metadata' => ['alt' => 'Hero Background 15', 'category' => 'hero'],
            ],
            [
                'name' => 'Hero Background 16',
                'description' => 'Sixteenth hero background',
                'image_path' => 'data_section/image/cover8.webp',
                'image_url' => 'http://localhost:8000/data_section/image/cover8.webp',
                'is_active' => true,
                'sort_order' => 16,
                'metadata' => ['alt' => 'Hero Background 16', 'category' => 'hero'],
            ],
        ];

        foreach ($backgrounds as $background) {
            HeroBackground::create($background);
        }

        $this->command->info('Hero backgrounds seeded successfully!');
    }
}