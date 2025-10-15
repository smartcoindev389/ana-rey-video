<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Web Development',
                'slug' => 'web-development',
                'description' => 'Learn modern web development technologies and frameworks',
                'color' => '#3B82F6',
                'icon' => 'code',
                'sort_order' => 1,
            ],
            [
                'name' => 'Mobile Development',
                'slug' => 'mobile-development',
                'description' => 'Build mobile applications for iOS and Android',
                'color' => '#10B981',
                'icon' => 'smartphone',
                'sort_order' => 2,
            ],
            [
                'name' => 'Data Science',
                'slug' => 'data-science',
                'description' => 'Master data analysis, machine learning, and AI',
                'color' => '#F59E0B',
                'icon' => 'chart-bar',
                'sort_order' => 3,
            ],
            [
                'name' => 'Design',
                'slug' => 'design',
                'description' => 'Learn UI/UX design, graphic design, and user experience',
                'color' => '#8B5CF6',
                'icon' => 'palette',
                'sort_order' => 4,
            ],
            [
                'name' => 'DevOps',
                'slug' => 'devops',
                'description' => 'Infrastructure, deployment, and automation',
                'color' => '#EF4444',
                'icon' => 'server',
                'sort_order' => 5,
            ],
            [
                'name' => 'Programming Languages',
                'slug' => 'programming-languages',
                'description' => 'Master different programming languages',
                'color' => '#06B6D4',
                'icon' => 'terminal',
                'sort_order' => 6,
            ],
            [
                'name' => 'Database',
                'slug' => 'database',
                'description' => 'Learn database design, SQL, and data management',
                'color' => '#84CC16',
                'icon' => 'database',
                'sort_order' => 7,
            ],
            [
                'name' => 'Cybersecurity',
                'slug' => 'cybersecurity',
                'description' => 'Protect systems and data from cyber threats',
                'color' => '#F97316',
                'icon' => 'shield-check',
                'sort_order' => 8,
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}