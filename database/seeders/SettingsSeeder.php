<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SiteSetting;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Hero Section Settings
        $heroSettings = [
            [
                'key' => 'hero_title',
                'value' => 'Sculpting Mastery',
                'type' => 'text',
                'group' => 'hero',
                'label' => 'Hero Title',
                'description' => 'Main title displayed in the hero section',
                'sort_order' => 1,
            ],
            [
                'key' => 'hero_subtitle',
                'value' => 'Witness the artistry behind incredible sculpting techniques and restoration processes',
                'type' => 'text',
                'group' => 'hero',
                'label' => 'Hero Subtitle',
                'description' => 'Subtitle displayed in the hero section',
                'sort_order' => 2,
            ],
            [
                'key' => 'hero_cta_text',
                'value' => 'Start enjoying SACRART plans from only',
                'type' => 'text',
                'group' => 'hero',
                'label' => 'Hero CTA Text',
                'description' => 'Call to action text in hero section',
                'sort_order' => 3,
            ],
            [
                'key' => 'hero_price',
                'value' => '$9.99/month',
                'type' => 'text',
                'group' => 'hero',
                'label' => 'Hero Price',
                'description' => 'Price displayed in hero section',
                'sort_order' => 4,
            ],
            [
                'key' => 'hero_cta_button_text',
                'value' => 'GET SACRART',
                'type' => 'text',
                'group' => 'hero',
                'label' => 'Hero Button Text',
                'description' => 'Button text in hero section',
                'sort_order' => 5,
            ],
            [
                'key' => 'hero_disclaimer',
                'value' => '*Requires subscription and the Premium add-on (its availability varies depending on the subscription provider). Automatic renewal unless canceled. Subject to Terms and Conditions. Content availability varies by plan. +18.',
                'type' => 'text',
                'group' => 'hero',
                'label' => 'Hero Disclaimer',
                'description' => 'Disclaimer text in hero section',
                'sort_order' => 6,
            ],
            [
                'key' => 'hero_background_images',
                'value' => json_encode([
                    ['url' => '/assets/cover1.webp', 'alt' => 'Sculpting Series', 'rotation' => -8, 'x' => 10, 'y' => 15],
                    ['url' => '/assets/cover2.webp', 'alt' => 'Art Techniques', 'rotation' => 12, 'x' => 25, 'y' => 5],
                    ['url' => '/assets/cover3.webp', 'alt' => 'Master Classes', 'rotation' => -5, 'x' => 45, 'y' => 20],
                    ['url' => '/assets/cover4.webp', 'alt' => 'Restoration', 'rotation' => 8, 'x' => 65, 'y' => 10],
                    ['url' => '/assets/cover5.webp', 'alt' => 'Behind Scenes', 'rotation' => -12, 'x' => 80, 'y' => 25],
                    ['url' => '/assets/cover6.webp', 'alt' => 'Professional Tips', 'rotation' => 6, 'x' => 15, 'y' => 35],
                    ['url' => '/assets/cover7.webp', 'alt' => 'Creative Process', 'rotation' => -10, 'x' => 35, 'y' => 40],
                    ['url' => '/assets/cover8.webp', 'alt' => 'Expert Insights', 'rotation' => 9, 'x' => 55, 'y' => 35],
                ]),
                'type' => 'json',
                'group' => 'hero',
                'label' => 'Hero Background Images',
                'description' => 'JSON array of background images for hero section with url, alt, rotation, x, y properties',
                'sort_order' => 7,
            ],
        ];

        // About Section Settings
        $aboutSettings = [
            [
                'key' => 'about_title',
                'value' => 'About SACRART',
                'type' => 'text',
                'group' => 'about',
                'label' => 'About Title',
                'description' => 'Title for the about section',
                'sort_order' => 1,
            ],
            [
                'key' => 'about_description',
                'value' => 'SACRART is the premier platform for classical and contemporary sculpting education. Our mission is to preserve and teach traditional art techniques while embracing modern innovations in the field of sculpture and restoration.',
                'type' => 'text',
                'group' => 'about',
                'label' => 'About Description',
                'description' => 'Description for the about section',
                'sort_order' => 2,
            ],
            [
                'key' => 'about_image',
                'value' => '/assets/cover1.webp',
                'type' => 'text',
                'group' => 'about',
                'label' => 'About Image',
                'description' => 'Image for the about section',
                'sort_order' => 3,
            ],
        ];

        // Testimonial Section Settings
        $testimonialSettings = [
            [
                'key' => 'testimonial_title',
                'value' => 'What Our Students Say',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial Title',
                'description' => 'Title for the testimonial section',
                'sort_order' => 1,
            ],
            [
                'key' => 'testimonial_subtitle',
                'value' => 'Discover how SACRART has transformed the artistic journey of our community members.',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial Subtitle',
                'description' => 'Subtitle for the testimonial section',
                'sort_order' => 2,
            ],
            [
                'key' => 'testimonial_1_name',
                'value' => 'María González',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 1 Name',
                'description' => 'Name for first testimonial',
                'sort_order' => 3,
            ],
            [
                'key' => 'testimonial_1_role',
                'value' => 'Professional Sculptor',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 1 Role',
                'description' => 'Role for first testimonial',
                'sort_order' => 4,
            ],
            [
                'key' => 'testimonial_1_content',
                'value' => 'SACRART has revolutionized my understanding of classical techniques. The quality of instruction and attention to detail is unmatched.',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 1 Content',
                'description' => 'Content for first testimonial',
                'sort_order' => 5,
            ],
            [
                'key' => 'testimonial_1_image',
                'value' => '/assets/cover2.webp',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 1 Image',
                'description' => 'Image for first testimonial',
                'sort_order' => 6,
            ],
            [
                'key' => 'testimonial_2_name',
                'value' => 'James Wilson',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 2 Name',
                'description' => 'Name for second testimonial',
                'sort_order' => 7,
            ],
            [
                'key' => 'testimonial_2_role',
                'value' => 'Art Restoration Specialist',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 2 Role',
                'description' => 'Role for second testimonial',
                'sort_order' => 8,
            ],
            [
                'key' => 'testimonial_2_content',
                'value' => 'The restoration courses are incredibly comprehensive. I\'ve been able to apply these techniques directly to my professional work.',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 2 Content',
                'description' => 'Content for second testimonial',
                'sort_order' => 9,
            ],
            [
                'key' => 'testimonial_2_image',
                'value' => '/assets/cover3.webp',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 2 Image',
                'description' => 'Image for second testimonial',
                'sort_order' => 10,
            ],
            [
                'key' => 'testimonial_3_name',
                'value' => 'Elena Rossi',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 3 Name',
                'description' => 'Name for third testimonial',
                'sort_order' => 11,
            ],
            [
                'key' => 'testimonial_3_role',
                'value' => 'Contemporary Artist',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 3 Role',
                'description' => 'Role for third testimonial',
                'sort_order' => 12,
            ],
            [
                'key' => 'testimonial_3_content',
                'value' => 'The blend of traditional and modern approaches has opened new creative possibilities I never knew existed.',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 3 Content',
                'description' => 'Content for third testimonial',
                'sort_order' => 13,
            ],
            [
                'key' => 'testimonial_3_image',
                'value' => '/assets/cover4.webp',
                'type' => 'text',
                'group' => 'testimonial',
                'label' => 'Testimonial 3 Image',
                'description' => 'Image for third testimonial',
                'sort_order' => 14,
            ],
        ];

        // Create or update settings
        foreach (array_merge($heroSettings, $aboutSettings, $testimonialSettings) as $settingData) {
            SiteSetting::updateOrCreate(
                ['key' => $settingData['key']],
                $settingData
            );
        }
    }
}
