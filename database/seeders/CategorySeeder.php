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
                'name' => 'Sculpture',
                'slug' => 'sculpture',
                'description' => 'Master classical and contemporary sculpting techniques',
                'color' => '#E11D48',
                'icon' => 'hand',
                'sort_order' => 1,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_active' => true,
            ],
            [
                'name' => 'Drawing',
                'slug' => 'drawing',
                'description' => 'Learn fundamental and advanced drawing techniques',
                'color' => '#8B5CF6',
                'icon' => 'pencil',
                'sort_order' => 2,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_active' => true,
            ],
            [
                'name' => 'Polychromy',
                'slug' => 'polychromy',
                'description' => 'Explore color theory, painting techniques, and polychrome methods',
                'color' => '#F59E0B',
                'icon' => 'palette',
                'sort_order' => 3,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_active' => true,
            ],
            [
                'name' => 'Restoration',
                'slug' => 'restoration',
                'description' => 'Master art conservation and restoration techniques',
                'color' => '#10B981',
                'icon' => 'hammer',
                'sort_order' => 4,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_active' => true,
            ],
            [
                'name' => '3D Modeling',
                'slug' => '3d-modeling',
                'description' => 'Learn digital 3D modeling, sculpting, and visualization',
                'color' => '#3B82F6',
                'icon' => 'box',
                'sort_order' => 5,
                'visibility' => 'freemium',
                'status' => 'published',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}