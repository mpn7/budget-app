<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InvestmentsController extends Controller
{
    /**
     * Display investments breakdown by category and year.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Get investment category IDs (both parent and child categories marked as investment)
        $investmentCategoryIds = Category::where('user_id', $user->id)
            ->where('is_investment', true)
            ->pluck('id')
            ->toArray();

        // Get all categories with their parents for checking parent investment status
        $allCategories = Category::where('user_id', $user->id)
            ->with('parent')
            ->get()
            ->keyBy('id');

        // Helper function to check if a category is an investment
        $isInvestmentCategory = function ($categoryId) use ($investmentCategoryIds, $allCategories) {
            // Check if the category itself is marked as investment
            if (in_array($categoryId, $investmentCategoryIds)) {
                return true;
            }

            // Check if the parent category is marked as investment
            $category = $allCategories->get($categoryId);
            if ($category && $category->parent_id) {
                $parent = $allCategories->get($category->parent_id);
                if ($parent && $parent->is_investment) {
                    return true;
                }
            }

            return false;
        };

        // Get all investment transactions
        $allTransactions = Transaction::where('user_id', $user->id)
            ->with('category')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        // Filter to only investment transactions
        $investmentTransactions = $allTransactions->filter(function ($transaction) use ($isInvestmentCategory) {
            return $isInvestmentCategory($transaction->category_id);
        });

        // Get all unique years that have investment transactions
        $years = $investmentTransactions->pluck('year')->unique()->sort()->values()->toArray();

        // Get all unique category IDs from investment transactions
        $categoryIdsWithInvestments = $investmentTransactions->pluck('category_id')->unique()->toArray();

        // Get all categories that have investment transactions
        $investmentCategories = Category::where('user_id', $user->id)
            ->whereIn('id', $categoryIdsWithInvestments)
            ->with('parent')
            ->orderBy('name')
            ->get();

        // Group transactions by category and year
        $breakdown = [];
        $categoryTotals = [];
        $yearTotals = [];

        foreach ($investmentCategories as $category) {
            $categoryId = $category->id;
            $categoryName = $category->parent_id 
                ? $category->parent->name . ' - ' . $category->name 
                : $category->name;
            $categoryColor = $category->color;

            $breakdown[$categoryId] = [
                'id' => $categoryId,
                'name' => $categoryName,
                'color' => $categoryColor,
                'years' => [],
                'total' => 0,
            ];

            $categoryTotals[$categoryId] = 0;

            // Calculate totals for each year
            foreach ($years as $year) {
                $yearTransactions = $investmentTransactions
                    ->where('category_id', $categoryId)
                    ->where('year', $year);

                $yearTotal = $yearTransactions->sum('amount');
                
                $breakdown[$categoryId]['years'][$year] = (float) $yearTotal;
                $categoryTotals[$categoryId] += $yearTotal;

                // Track year totals
                if (!isset($yearTotals[$year])) {
                    $yearTotals[$year] = 0;
                }
                $yearTotals[$year] += $yearTotal;
            }

            $breakdown[$categoryId]['total'] = (float) $categoryTotals[$categoryId];
        }

        // Remove categories with no investments
        $breakdown = array_filter($breakdown, function ($category) {
            return $category['total'] > 0;
        });

        // Sort by total descending
        usort($breakdown, function ($a, $b) {
            return $b['total'] <=> $a['total'];
        });

        // Calculate grand total
        $grandTotal = array_sum($categoryTotals);

        return Inertia::render('Investments/Index', [
            'breakdown' => array_values($breakdown),
            'years' => $years,
            'yearTotals' => $yearTotals,
            'grandTotal' => (float) $grandTotal,
        ]);
    }
}

