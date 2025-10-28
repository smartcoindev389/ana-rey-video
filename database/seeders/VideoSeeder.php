<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Video;
use App\Models\Category;
use App\Models\User;

class VideoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get admin user
        $adminUser = User::where('email', 'admin@ana.com')->first();
        
        // Get art categories
        $sculptureCategory = Category::where('slug', 'sculpture')->first();
        $drawingCategory = Category::where('slug', 'drawing')->first();
        $polychromyCategory = Category::where('slug', 'polychromy')->first();
        $restorationCategory = Category::where('slug', 'restoration')->first();
        $modelingCategory = Category::where('slug', '3d-modeling')->first();

        $videos = [
            // Sculpture Category Videos
            [
                'title' => 'Introduction to Classical Sculpture',
                'slug' => 'introduction-to-classical-sculpture',
                'description' => 'Learn the fundamentals of classical sculpture techniques and form study.',
                'short_description' => 'Master classical sculpting fundamentals',
                'category_id' => $sculptureCategory->id,
                'instructor_id' => $adminUser->id,
                'video_url' => 'https://example.com/videos/sculpture-intro.mp4',
                'thumbnail' => 'sculpture-intro-thumb.jpg',
                'duration' => 1800,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 1,
                'sort_order' => 1,
                'tags' => ['sculpture', 'classical', 'fundamentals'],
                'published_at' => now(),
            ],
            [
                'title' => 'Clay Modeling Techniques',
                'slug' => 'clay-modeling-techniques',
                'description' => 'Explore various clay modeling techniques and textures.',
                'short_description' => 'Master clay modeling methods',
                'category_id' => $sculptureCategory->id,
                'instructor_id' => $adminUser->id,
                'video_url' => 'https://example.com/videos/clay-modeling.mp4',
                'thumbnail' => 'clay-modeling-thumb.jpg',
                'duration' => 2400,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 2,
                'sort_order' => 2,
                'tags' => ['sculpture', 'clay', 'modeling'],
                'published_at' => now(),
            ],
            [
                'title' => 'Marble Carving Basics',
                'slug' => 'marble-carving-basics',
                'description' => 'Learn the traditional art of marble carving.',
                'short_description' => 'Traditional marble carving',
                'category_id' => $sculptureCategory->id,
                'instructor_id' => $adminUser->id,
                'video_url' => 'https://example.com/videos/marble-carving.mp4',
                'thumbnail' => 'marble-carving-thumb.jpg',
                'duration' => 2700,
                'visibility' => 'basic',
                'status' => 'published',
                'is_free' => false,
                'price' => 9.99,
                'episode_number' => 3,
                'sort_order' => 3,
                'tags' => ['sculpture', 'marble', 'carving'],
                'published_at' => now(),
            ],

            // Drawing Category Videos
            [
                'title' => 'Fundamentals of Life Drawing',
                'slug' => 'fundamentals-of-life-drawing',
                'description' => 'Master the art of drawing the human figure from life.',
                'short_description' => 'Learn life drawing techniques',
                'category_id' => $drawingCategory->id,
                'instructor_id' => $adminUser->id,
                'video_url' => 'https://example.com/videos/life-drawing.mp4',
                'thumbnail' => 'life-drawing-thumb.jpg',
                'duration' => 1800,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 1,
                'sort_order' => 1,
                'tags' => ['drawing', 'life-drawing', 'figure'],
                'published_at' => now(),
            ],
            [
                'title' => 'Perspective Drawing Techniques',
                'slug' => 'perspective-drawing-techniques',
                'description' => 'Learn one-point and two-point perspective for realistic drawings.',
                'short_description' => 'Master perspective drawing',
                'category_id' => $drawingCategory->id,
                'instructor_id' => $adminUser->id,
                'video_url' => 'https://example.com/videos/perspective.mp4',
                'thumbnail' => 'perspective-thumb.jpg',
                'duration' => 2400,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 2,
                'sort_order' => 2,
                'tags' => ['drawing', 'perspective', 'techniques'],
                'published_at' => now(),
            ],

            // Polychromy Category Videos
            [
                'title' => 'Color Theory Fundamentals',
                'slug' => 'color-theory-fundamentals',
                'description' => 'Understand the science and art of color in painting.',
                'short_description' => 'Master color theory',
                'category_id' => $polychromyCategory->id,
                'instructor_id' => $adminUser->id,
                'video_url' => 'https://example.com/videos/color-theory.mp4',
                'thumbnail' => 'color-theory-thumb.jpg',
                'duration' => 1800,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 1,
                'sort_order' => 1,
                'tags' => ['polychromy', 'color', 'theory'],
                'published_at' => now(),
            ],
            [
                'title' => 'Oil Painting Techniques',
                'slug' => 'oil-painting-techniques',
                'description' => 'Learn classical and modern oil painting methods.',
                'short_description' => 'Classical oil painting',
                'category_id' => $polychromyCategory->id,
                'instructor_id' => $adminUser->id,
                'video_url' => 'https://example.com/videos/oil-painting.mp4',
                'thumbnail' => 'oil-painting-thumb.jpg',
                'duration' => 2700,
                'visibility' => 'basic',
                'status' => 'published',
                'is_free' => false,
                'price' => 9.99,
                'episode_number' => 2,
                'sort_order' => 2,
                'tags' => ['polychromy', 'oil-painting', 'classical'],
                'published_at' => now(),
            ],

            // Restoration Category Videos
            [
                'title' => 'Introduction to Art Restoration',
                'slug' => 'introduction-to-art-restoration',
                'description' => 'Learn the principles and ethics of art conservation.',
                'short_description' => 'Art restoration fundamentals',
                'category_id' => $restorationCategory->id,
                'instructor_id' => $adminUser->id,
                'video_url' => 'https://example.com/videos/restoration-intro.mp4',
                'thumbnail' => 'restoration-intro-thumb.jpg',
                'duration' => 1800,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 1,
                'sort_order' => 1,
                'tags' => ['restoration', 'conservation', 'ethics'],
                'published_at' => now(),
            ],
            [
                'title' => 'Paint Layer Analysis',
                'slug' => 'paint-layer-analysis',
                'description' => 'Examine historical paint layers and restoration techniques.',
                'short_description' => 'Paint layer examination',
                'category_id' => $restorationCategory->id,
                'instructor_id' => $adminUser->id,
                'video_url' => 'https://example.com/videos/paint-analysis.mp4',
                'thumbnail' => 'paint-analysis-thumb.jpg',
                'duration' => 2400,
                'visibility' => 'premium',
                'status' => 'published',
                'is_free' => false,
                'price' => 19.99,
                'episode_number' => 2,
                'sort_order' => 2,
                'tags' => ['restoration', 'analysis', 'techniques'],
                'published_at' => now(),
            ],

            // 3D Modeling Category Videos
            [
                'title' => 'Getting Started with 3D Sculpting',
                'slug' => 'getting-started-with-3d-sculpting',
                'description' => 'Introduction to digital 3D sculpting tools and workflows.',
                'short_description' => 'Digital sculpting basics',
                'category_id' => $modelingCategory->id,
                'instructor_id' => $adminUser->id,
                'video_url' => 'https://example.com/videos/3d-sculpting.mp4',
                'thumbnail' => '3d-sculpting-thumb.jpg',
                'duration' => 1800,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 1,
                'sort_order' => 1,
                'tags' => ['3d-modeling', 'digital', 'sculpting'],
                'published_at' => now(),
            ],
        ];

        foreach ($videos as $video) {
            Video::create($video);
        }

        // Update category statistics
        foreach (Category::all() as $category) {
            $category->updateStatistics();
        }
    }
}