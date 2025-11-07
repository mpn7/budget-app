<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            // Only seed if user has no categories
            if ($user->categories()->count() > 0) {
                continue;
            }

            $categories = [
                [
                    'name' => 'Housing',
                    'color' => '#8B5CF6',
                    'order' => 1,
                    'subcategories' => [
                        ['name' => 'Rent/Mortgage', 'color' => '#A78BFA', 'order' => 1],
                        ['name' => 'Utilities', 'color' => '#A78BFA', 'order' => 2],
                        ['name' => 'Home Insurance', 'color' => '#A78BFA', 'order' => 3],
                        ['name' => 'Maintenance', 'color' => '#A78BFA', 'order' => 4],
                        ['name' => 'Property Tax', 'color' => '#A78BFA', 'order' => 5],
                    ],
                ],
                [
                    'name' => 'Transportation',
                    'color' => '#7C3AED',
                    'order' => 2,
                    'subcategories' => [
                        ['name' => 'Car Payment', 'color' => '#8B5CF6', 'order' => 1],
                        ['name' => 'Gas', 'color' => '#8B5CF6', 'order' => 2],
                        ['name' => 'Car Insurance', 'color' => '#8B5CF6', 'order' => 3],
                        ['name' => 'Maintenance', 'color' => '#8B5CF6', 'order' => 4],
                        ['name' => 'Public Transit', 'color' => '#8B5CF6', 'order' => 5],
                    ],
                ],
                [
                    'name' => 'Food',
                    'color' => '#6D28D9',
                    'order' => 3,
                    'subcategories' => [
                        ['name' => 'Groceries', 'color' => '#7C3AED', 'order' => 1],
                        ['name' => 'Restaurants', 'color' => '#7C3AED', 'order' => 2],
                        ['name' => 'Coffee/Tea', 'color' => '#7C3AED', 'order' => 3],
                    ],
                ],
                [
                    'name' => 'Personal Care',
                    'color' => '#5B21B6',
                    'order' => 4,
                    'subcategories' => [
                        ['name' => 'Haircuts', 'color' => '#6D28D9', 'order' => 1],
                        ['name' => 'Personal Products', 'color' => '#6D28D9', 'order' => 2],
                        ['name' => 'Gym/Fitness', 'color' => '#6D28D9', 'order' => 3],
                    ],
                ],
                [
                    'name' => 'Entertainment',
                    'color' => '#4C1D95',
                    'order' => 5,
                    'subcategories' => [
                        ['name' => 'Movies/Streaming', 'color' => '#5B21B6', 'order' => 1],
                        ['name' => 'Hobbies', 'color' => '#5B21B6', 'order' => 2],
                        ['name' => 'Events', 'color' => '#5B21B6', 'order' => 3],
                    ],
                ],
                [
                    'name' => 'Health',
                    'color' => '#3B1A7A',
                    'order' => 6,
                    'subcategories' => [
                        ['name' => 'Health Insurance', 'color' => '#4C1D95', 'order' => 1],
                        ['name' => 'Doctor Visits', 'color' => '#4C1D95', 'order' => 2],
                        ['name' => 'Medications', 'color' => '#4C1D95', 'order' => 3],
                    ],
                ],
                [
                    'name' => 'Shopping',
                    'color' => '#2D1B5E',
                    'order' => 7,
                    'subcategories' => [
                        ['name' => 'Clothing', 'color' => '#3B1A7A', 'order' => 1],
                        ['name' => 'Electronics', 'color' => '#3B1A7A', 'order' => 2],
                        ['name' => 'Other', 'color' => '#3B1A7A', 'order' => 3],
                    ],
                ],
                [
                    'name' => 'Debt Payments',
                    'color' => '#1E0F3F',
                    'order' => 8,
                    'subcategories' => [
                        ['name' => 'Credit Cards', 'color' => '#2D1B5E', 'order' => 1],
                        ['name' => 'Student Loans', 'color' => '#2D1B5E', 'order' => 2],
                        ['name' => 'Other Loans', 'color' => '#2D1B5E', 'order' => 3],
                    ],
                ],
                [
                    'name' => 'Savings & Investments',
                    'color' => '#9333EA',
                    'order' => 9,
                    'subcategories' => [
                        ['name' => 'Emergency Fund', 'color' => '#A855F7', 'order' => 1],
                        ['name' => 'Retirement', 'color' => '#A855F7', 'order' => 2],
                        ['name' => 'Investments', 'color' => '#A855F7', 'order' => 3],
                    ],
                ],
                [
                    'name' => 'Other',
                    'color' => '#C084FC',
                    'order' => 10,
                    'subcategories' => [],
                ],
            ];

            foreach ($categories as $categoryData) {
                $subcategories = $categoryData['subcategories'] ?? [];
                unset($categoryData['subcategories']);

                $category = Category::create([
                    ...$categoryData,
                    'user_id' => $user->id,
                ]);

                foreach ($subcategories as $subcategoryData) {
                    Category::create([
                        ...$subcategoryData,
                        'user_id' => $user->id,
                        'parent_id' => $category->id,
                    ]);
                }
            }
        }
    }
}
