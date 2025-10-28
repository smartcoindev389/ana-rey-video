<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Testimonial;
use App\Models\User;
use App\Models\Video;

class TestimonialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some users and videos for associations
        $users = User::all();
        $videos = Video::all();

        $testimonials = [
            [
                'name' => 'Sarah Martinez',
                'role' => 'Professional Sculptor',
                'company' => 'Martinez Studio',
                'avatar' => null,
                'content' => 'The sculpting techniques I learned here have completely transformed my work. The instructors are masters of their craft and explain complex concepts in a way that\'s easy to understand. Highly recommended!',
                'rating' => 5,
                'is_approved' => true,
                'is_featured' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Michael Chen',
                'role' => 'Art Educator',
                'company' => 'Metropolitan Academy',
                'avatar' => null,
                'content' => 'As an art educator, I use these videos in my teaching. The quality is exceptional and my students love the detailed demonstrations. It\'s like having a master sculptor teaching in every class.',
                'rating' => 5,
                'is_approved' => true,
                'is_featured' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Elena Rodriguez',
                'role' => 'Restoration Specialist',
                'company' => 'Heritage Restoration Co.',
                'avatar' => null,
                'content' => 'The restoration techniques covered in these videos are invaluable. I\'ve applied many of the methods to my professional work with outstanding results. The platform is a treasure trove of knowledge.',
                'rating' => 5,
                'is_approved' => true,
                'is_featured' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'James Thompson',
                'role' => 'Hobbyist',
                'company' => null,
                'avatar' => null,
                'content' => 'I started as a complete beginner and these videos have been my guide. The step-by-step approach and clear explanations made learning sculpting accessible and enjoyable.',
                'rating' => 5,
                'is_approved' => true,
                'is_featured' => false,
                'sort_order' => 4,
            ],
            [
                'name' => 'Anna Wilson',
                'role' => 'Digital Sculptor',
                'company' => '3D Modeling Studio',
                'avatar' => null,
                'content' => 'Even as a digital artist, the traditional techniques I learned here have improved my 3D modeling work significantly. Understanding form and structure through classic methods is invaluable.',
                'rating' => 5,
                'is_approved' => true,
                'is_featured' => false,
                'sort_order' => 5,
            ],
            [
                'name' => 'David Park',
                'role' => 'Art Student',
                'company' => null,
                'avatar' => null,
                'content' => 'Perfect supplement to my art studies. The videos cover everything from basics to advanced techniques. I especially appreciate the drawing and polychromy content.',
                'rating' => 5,
                'is_approved' => true,
                'is_featured' => false,
                'sort_order' => 6,
            ],
        ];

        foreach ($testimonials as $index => $testimonial) {
            Testimonial::create([
                'user_id' => $users->isNotEmpty() ? $users->random()->id : null,
                'video_id' => $videos->isNotEmpty() && $index % 2 === 0 ? $videos->random()->id : null,
                'name' => $testimonial['name'],
                'role' => $testimonial['role'],
                'company' => $testimonial['company'],
                'avatar' => $testimonial['avatar'],
                'content' => $testimonial['content'],
                'rating' => $testimonial['rating'],
                'is_approved' => $testimonial['is_approved'],
                'is_featured' => $testimonial['is_featured'],
                'sort_order' => $testimonial['sort_order'],
            ]);
        }
    }
}
