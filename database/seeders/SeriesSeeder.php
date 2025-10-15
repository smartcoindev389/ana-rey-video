<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Series;
use App\Models\Category;
use App\Models\User;

class SeriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $webDevCategory = Category::where('slug', 'web-development')->first();
        $mobileCategory = Category::where('slug', 'mobile-development')->first();
        $dataScienceCategory = Category::where('slug', 'data-science')->first();
        $designCategory = Category::where('slug', 'design')->first();
        $programmingCategory = Category::where('slug', 'programming-languages')->first();

        // Get admin user as instructor
        $adminUser = User::where('email', 'admin@ana.com')->first();

        $series = [
            [
                'title' => 'React Fundamentals',
                'slug' => 'react-fundamentals',
                'description' => 'Learn the fundamentals of React development including components, state management, hooks, and modern React patterns. This comprehensive course covers everything you need to know to build modern web applications with React.',
                'short_description' => 'Master React from basics to advanced concepts',
                'visibility' => 'freemium',
                'status' => 'published',
                'category_id' => $webDevCategory->id,
                'instructor_id' => $adminUser->id,
                'thumbnail' => 'react-thumbnail.jpg',
                'cover_image' => 'react-cover.jpg',
                'meta_title' => 'React Fundamentals Course - Learn React Development',
                'meta_description' => 'Complete React course covering components, hooks, state management and modern patterns.',
                'meta_keywords' => 'react, javascript, frontend, web development, components',
                'price' => 0,
                'is_free' => true,
                'is_featured' => true,
                'featured_until' => now()->addDays(30),
                'tags' => ['react', 'javascript', 'frontend', 'components', 'hooks'],
                'published_at' => now(),
            ],
            [
                'title' => 'Advanced JavaScript',
                'slug' => 'advanced-javascript',
                'description' => 'Deep dive into advanced JavaScript concepts including closures, prototypes, async programming, ES6+ features, and modern development patterns. Perfect for developers looking to master JavaScript.',
                'short_description' => 'Advanced JavaScript concepts and modern patterns',
                'visibility' => 'basic',
                'status' => 'published',
                'category_id' => $programmingCategory->id,
                'instructor_id' => $adminUser->id,
                'thumbnail' => 'js-thumbnail.jpg',
                'cover_image' => 'js-cover.jpg',
                'meta_title' => 'Advanced JavaScript Course - Master Modern JS',
                'meta_description' => 'Learn advanced JavaScript concepts including ES6+, async programming, and modern patterns.',
                'meta_keywords' => 'javascript, es6, async, closures, prototypes',
                'price' => 29.99,
                'is_free' => false,
                'is_featured' => false,
                'tags' => ['javascript', 'es6', 'async', 'closures', 'prototypes'],
                'published_at' => now(),
            ],
            [
                'title' => 'UI/UX Design Mastery',
                'slug' => 'ui-ux-design-mastery',
                'description' => 'Complete guide to UI/UX design principles, user research, wireframing, prototyping, and design systems. Learn to create beautiful and functional user interfaces that users love.',
                'short_description' => 'Master UI/UX design principles and tools',
                'visibility' => 'freemium',
                'status' => 'published',
                'category_id' => $designCategory->id,
                'instructor_id' => $adminUser->id,
                'thumbnail' => 'design-thumbnail.jpg',
                'cover_image' => 'design-cover.jpg',
                'meta_title' => 'UI/UX Design Mastery Course - Design Better Interfaces',
                'meta_description' => 'Learn UI/UX design principles, user research, wireframing, and design systems.',
                'meta_keywords' => 'ui, ux, design, figma, user research, wireframing',
                'price' => 0,
                'is_free' => true,
                'is_featured' => true,
                'featured_until' => now()->addDays(15),
                'tags' => ['ui', 'ux', 'design', 'figma', 'user-research'],
                'published_at' => now(),
            ],
            [
                'title' => 'Full Stack Development',
                'slug' => 'full-stack-development',
                'description' => 'Build complete web applications from frontend to backend. Learn React, Node.js, Express, MongoDB, authentication, deployment, and modern full-stack development practices.',
                'short_description' => 'Complete full-stack web development course',
                'visibility' => 'premium',
                'status' => 'published',
                'category_id' => $webDevCategory->id,
                'instructor_id' => $adminUser->id,
                'thumbnail' => 'fullstack-thumbnail.jpg',
                'cover_image' => 'fullstack-cover.jpg',
                'meta_title' => 'Full Stack Development Course - Complete Web Apps',
                'meta_description' => 'Learn full-stack development with React, Node.js, Express, and MongoDB.',
                'meta_keywords' => 'fullstack, react, nodejs, mongodb, web development',
                'price' => 99.99,
                'is_free' => false,
                'is_featured' => true,
                'featured_until' => now()->addDays(60),
                'tags' => ['fullstack', 'react', 'nodejs', 'mongodb', 'express'],
                'published_at' => now(),
            ],
            [
                'title' => 'React Native Mobile Development',
                'slug' => 'react-native-mobile-development',
                'description' => 'Build cross-platform mobile applications with React Native. Learn navigation, state management, native modules, and deployment to app stores.',
                'short_description' => 'Build mobile apps with React Native',
                'visibility' => 'basic',
                'status' => 'published',
                'category_id' => $mobileCategory->id,
                'instructor_id' => $adminUser->id,
                'thumbnail' => 'reactnative-thumbnail.jpg',
                'cover_image' => 'reactnative-cover.jpg',
                'meta_title' => 'React Native Course - Mobile App Development',
                'meta_description' => 'Learn to build cross-platform mobile apps with React Native.',
                'meta_keywords' => 'react native, mobile, ios, android, cross-platform',
                'price' => 49.99,
                'is_free' => false,
                'is_featured' => false,
                'tags' => ['react-native', 'mobile', 'ios', 'android'],
                'published_at' => now(),
            ],
            [
                'title' => 'Python Data Science',
                'slug' => 'python-data-science',
                'description' => 'Master data science with Python including pandas, NumPy, Matplotlib, machine learning, and data visualization. Learn to analyze and extract insights from data.',
                'short_description' => 'Data science and machine learning with Python',
                'visibility' => 'premium',
                'status' => 'published',
                'category_id' => $dataScienceCategory->id,
                'instructor_id' => $adminUser->id,
                'thumbnail' => 'python-ds-thumbnail.jpg',
                'cover_image' => 'python-ds-cover.jpg',
                'meta_title' => 'Python Data Science Course - ML and Analytics',
                'meta_description' => 'Learn data science and machine learning with Python, pandas, and scikit-learn.',
                'meta_keywords' => 'python, data science, machine learning, pandas, numpy',
                'price' => 79.99,
                'is_free' => false,
                'is_featured' => true,
                'featured_until' => now()->addDays(45),
                'tags' => ['python', 'data-science', 'machine-learning', 'pandas', 'numpy'],
                'published_at' => now(),
            ],
        ];

        foreach ($series as $serie) {
            Series::create($serie);
        }
    }
}