<?php

namespace Database\Seeders;

use App\Models\IncomeSource;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class IncomeSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            // Only seed if user has no income sources
            if ($user->incomeSources()->count() > 0) {
                continue;
            }

            $incomeSources = [
                [
                    'name' => 'Salary',
                    'color' => '#8B5CF6',
                    'order' => 1,
                ],
                [
                    'name' => 'Freelance',
                    'color' => '#7C3AED',
                    'order' => 2,
                ],
                [
                    'name' => 'Investment Returns',
                    'color' => '#6D28D9',
                    'order' => 3,
                ],
                [
                    'name' => 'Rental Income',
                    'color' => '#5B21B6',
                    'order' => 4,
                ],
                [
                    'name' => 'Side Business',
                    'color' => '#4C1D95',
                    'order' => 5,
                ],
                [
                    'name' => 'Other',
                    'color' => '#9333EA',
                    'order' => 6,
                ],
            ];

            foreach ($incomeSources as $sourceData) {
                IncomeSource::create([
                    ...$sourceData,
                    'user_id' => $user->id,
                ]);
            }
        }
    }
}
