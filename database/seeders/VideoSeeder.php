<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Video;
use App\Models\Series;

class VideoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $reactSeries = Series::where('slug', 'react-fundamentals')->first();
        $jsSeries = Series::where('slug', 'advanced-javascript')->first();
        $designSeries = Series::where('slug', 'ui-ux-design-mastery')->first();
        $fullstackSeries = Series::where('slug', 'full-stack-development')->first();

        $videos = [
            // React Fundamentals Series
            [
                'title' => 'Introduction to React',
                'slug' => 'introduction-to-react',
                'description' => 'Get started with React by understanding its core concepts, virtual DOM, and component-based architecture.',
                'short_description' => 'Learn the basics of React and its core concepts',
                'series_id' => $reactSeries->id,
                'instructor_id' => $reactSeries->instructor_id,
                'video_url' => 'https://example.com/videos/react-intro.mp4',
                'thumbnail' => 'react-intro-thumb.jpg',
                'duration' => 1800, // 30 minutes
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 1,
                'sort_order' => 1,
                'tags' => ['react', 'introduction', 'components'],
                'published_at' => now(),
            ],
            [
                'title' => 'Components and JSX',
                'slug' => 'components-and-jsx',
                'description' => 'Learn how to create and use React components with JSX syntax.',
                'short_description' => 'Master React components and JSX syntax',
                'series_id' => $reactSeries->id,
                'instructor_id' => $reactSeries->instructor_id,
                'video_url' => 'https://example.com/videos/react-components.mp4',
                'thumbnail' => 'react-components-thumb.jpg',
                'duration' => 2400, // 40 minutes
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 2,
                'sort_order' => 2,
                'tags' => ['react', 'components', 'jsx'],
                'published_at' => now(),
            ],
            [
                'title' => 'State and Props',
                'slug' => 'state-and-props',
                'description' => 'Understand React state management and props system for component communication.',
                'short_description' => 'Learn React state and props management',
                'series_id' => $reactSeries->id,
                'instructor_id' => $reactSeries->instructor_id,
                'video_url' => 'https://example.com/videos/react-state-props.mp4',
                'thumbnail' => 'react-state-thumb.jpg',
                'duration' => 2700, // 45 minutes
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 3,
                'sort_order' => 3,
                'tags' => ['react', 'state', 'props'],
                'published_at' => now(),
            ],
            [
                'title' => 'React Hooks',
                'slug' => 'react-hooks',
                'description' => 'Master modern React with hooks including useState, useEffect, and custom hooks.',
                'short_description' => 'Learn modern React hooks',
                'series_id' => $reactSeries->id,
                'instructor_id' => $reactSeries->instructor_id,
                'video_url' => 'https://example.com/videos/react-hooks.mp4',
                'thumbnail' => 'react-hooks-thumb.jpg',
                'duration' => 3600, // 60 minutes
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 4,
                'sort_order' => 4,
                'tags' => ['react', 'hooks', 'usestate', 'useeffect'],
                'published_at' => now(),
            ],

            // Advanced JavaScript Series
            [
                'title' => 'ES6+ Features',
                'slug' => 'es6-features',
                'description' => 'Explore modern JavaScript features including arrow functions, destructuring, and modules.',
                'short_description' => 'Master ES6+ JavaScript features',
                'series_id' => $jsSeries->id,
                'instructor_id' => $jsSeries->instructor_id,
                'video_url' => 'https://example.com/videos/js-es6.mp4',
                'thumbnail' => 'js-es6-thumb.jpg',
                'duration' => 2700, // 45 minutes
                'visibility' => 'basic',
                'status' => 'published',
                'is_free' => false,
                'price' => 9.99,
                'episode_number' => 1,
                'sort_order' => 1,
                'tags' => ['javascript', 'es6', 'arrow-functions'],
                'published_at' => now(),
            ],
            [
                'title' => 'Async Programming',
                'slug' => 'async-programming',
                'description' => 'Learn asynchronous JavaScript with Promises, async/await, and error handling.',
                'short_description' => 'Master asynchronous JavaScript programming',
                'series_id' => $jsSeries->id,
                'instructor_id' => $jsSeries->instructor_id,
                'video_url' => 'https://example.com/videos/js-async.mp4',
                'thumbnail' => 'js-async-thumb.jpg',
                'duration' => 3600, // 60 minutes
                'visibility' => 'basic',
                'status' => 'published',
                'is_free' => false,
                'price' => 9.99,
                'episode_number' => 2,
                'sort_order' => 2,
                'tags' => ['javascript', 'async', 'promises', 'await'],
                'published_at' => now(),
            ],

            // UI/UX Design Series
            [
                'title' => 'Design Principles',
                'slug' => 'design-principles',
                'description' => 'Learn fundamental design principles including balance, contrast, and hierarchy.',
                'short_description' => 'Master fundamental design principles',
                'series_id' => $designSeries->id,
                'instructor_id' => $designSeries->instructor_id,
                'video_url' => 'https://example.com/videos/design-principles.mp4',
                'thumbnail' => 'design-principles-thumb.jpg',
                'duration' => 2400, // 40 minutes
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 1,
                'sort_order' => 1,
                'tags' => ['design', 'principles', 'ui', 'ux'],
                'published_at' => now(),
            ],
            [
                'title' => 'User Research',
                'slug' => 'user-research',
                'description' => 'Learn how to conduct user research and gather insights for better design decisions.',
                'short_description' => 'Conduct effective user research',
                'series_id' => $designSeries->id,
                'instructor_id' => $designSeries->instructor_id,
                'video_url' => 'https://example.com/videos/user-research.mp4',
                'thumbnail' => 'user-research-thumb.jpg',
                'duration' => 3000, // 50 minutes
                'visibility' => 'freemium',
                'status' => 'published',
                'is_free' => true,
                'episode_number' => 2,
                'sort_order' => 2,
                'tags' => ['design', 'user-research', 'ux'],
                'published_at' => now(),
            ],

            // Full Stack Development Series
            [
                'title' => 'Backend with Node.js',
                'slug' => 'backend-with-nodejs',
                'description' => 'Build robust backend APIs with Node.js, Express, and best practices.',
                'short_description' => 'Build backend APIs with Node.js',
                'series_id' => $fullstackSeries->id,
                'instructor_id' => $fullstackSeries->instructor_id,
                'video_url' => 'https://example.com/videos/nodejs-backend.mp4',
                'thumbnail' => 'nodejs-backend-thumb.jpg',
                'duration' => 4200, // 70 minutes
                'visibility' => 'premium',
                'status' => 'published',
                'is_free' => false,
                'price' => 19.99,
                'episode_number' => 1,
                'sort_order' => 1,
                'tags' => ['nodejs', 'express', 'backend', 'api'],
                'published_at' => now(),
            ],
            [
                'title' => 'Database Integration',
                'slug' => 'database-integration',
                'description' => 'Connect your backend to MongoDB and implement data persistence.',
                'short_description' => 'Integrate MongoDB with your backend',
                'series_id' => $fullstackSeries->id,
                'instructor_id' => $fullstackSeries->instructor_id,
                'video_url' => 'https://example.com/videos/mongodb-integration.mp4',
                'thumbnail' => 'mongodb-thumb.jpg',
                'duration' => 3600, // 60 minutes
                'visibility' => 'premium',
                'status' => 'published',
                'is_free' => false,
                'price' => 19.99,
                'episode_number' => 2,
                'sort_order' => 2,
                'tags' => ['mongodb', 'database', 'backend'],
                'published_at' => now(),
            ],
        ];

        foreach ($videos as $video) {
            Video::create($video);
        }

        // Update series statistics
        foreach (Series::all() as $series) {
            $series->updateStatistics();
        }
    }
}