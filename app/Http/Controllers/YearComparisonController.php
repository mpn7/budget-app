<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\IncomeEntry;
use App\Models\IncomeSource;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class YearComparisonController extends Controller
{
    public function index(Request $request)
    {
        $currentYear = date('Y');
        $year1 = $request->get('year1', $currentYear - 1);
        $year2 = $request->get('year2', $currentYear);

        $user = Auth::user();

        // Get year 1 data
        $year1Transactions = Transaction::where('user_id', $user->id)
            ->where('year', $year1)
            ->with('category')
            ->get();

        $year1Income = IncomeEntry::where('user_id', $user->id)
            ->where('year', $year1)
            ->sum('amount');

        // Get investment category IDs
        $investmentCategoryIds = Category::where('user_id', $user->id)
            ->where('is_investment', true)
            ->pluck('id')
            ->toArray();

        $allCategories = Category::where('user_id', $user->id)
            ->with('parent')
            ->get()
            ->keyBy('id');

        $isInvestmentCategory = function ($categoryId) use ($investmentCategoryIds, $allCategories) {
            if (in_array($categoryId, $investmentCategoryIds)) {
                return true;
            }
            $category = $allCategories->get($categoryId);
            if ($category && $category->parent_id) {
                $parent = $allCategories->get($category->parent_id);
                if ($parent && $parent->is_investment) {
                    return true;
                }
            }
            return false;
        };

        $year1InvestmentTransactions = $year1Transactions->filter(function ($transaction) use ($isInvestmentCategory) {
            return $isInvestmentCategory($transaction->category_id);
        });

        $year1RegularExpenses = $year1Transactions->filter(function ($transaction) use ($isInvestmentCategory) {
            return !$isInvestmentCategory($transaction->category_id);
        });

        $year1TotalExpenses = $year1RegularExpenses->sum('amount');
        $year1TotalInvestments = $year1InvestmentTransactions->sum('amount');
        $year1NetSavings = $year1Income - $year1TotalExpenses;

        // Get year 2 data
        $year2Transactions = Transaction::where('user_id', $user->id)
            ->where('year', $year2)
            ->with('category')
            ->get();

        $year2Income = IncomeEntry::where('user_id', $user->id)
            ->where('year', $year2)
            ->sum('amount');

        $year2InvestmentTransactions = $year2Transactions->filter(function ($transaction) use ($isInvestmentCategory) {
            return $isInvestmentCategory($transaction->category_id);
        });

        $year2RegularExpenses = $year2Transactions->filter(function ($transaction) use ($isInvestmentCategory) {
            return !$isInvestmentCategory($transaction->category_id);
        });

        $year2TotalExpenses = $year2RegularExpenses->sum('amount');
        $year2TotalInvestments = $year2InvestmentTransactions->sum('amount');
        $year2NetSavings = $year2Income - $year2TotalExpenses;

        // Category comparison
        $categories = Category::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('order')
            ->get();

        $categoryComparison = [];
        foreach ($categories as $category) {
            $year1CategoryTotal = 0;
            $year2CategoryTotal = 0;

            foreach ($category->children as $subcategory) {
                $year1SubTotal = Transaction::where('user_id', $user->id)
                    ->where('year', $year1)
                    ->where('category_id', $subcategory->id)
                    ->sum('amount');

                $year2SubTotal = Transaction::where('user_id', $user->id)
                    ->where('year', $year2)
                    ->where('category_id', $subcategory->id)
                    ->sum('amount');

                $year1CategoryTotal += $year1SubTotal;
                $year2CategoryTotal += $year2SubTotal;
            }

            // Only include categories that have expenses in at least one year
            if ($year1CategoryTotal > 0 || $year2CategoryTotal > 0) {
                $categoryComparison[] = [
                    'id' => $category->id,
                    'name' => $category->name,
                    'color' => $category->color,
                    'year1Amount' => (float) $year1CategoryTotal,
                    'year2Amount' => (float) $year2CategoryTotal,
                ];
            }
        }

        // Income source comparison
        $incomeSources = IncomeSource::where('user_id', $user->id)
            ->orderBy('order')
            ->get();

        $incomeSourceComparison = [];
        foreach ($incomeSources as $source) {
            $year1SourceTotal = IncomeEntry::where('user_id', $user->id)
                ->where('year', $year1)
                ->where('income_source_id', $source->id)
                ->sum('amount');

            $year2SourceTotal = IncomeEntry::where('user_id', $user->id)
                ->where('year', $year2)
                ->where('income_source_id', $source->id)
                ->sum('amount');

            // Only include sources that have income in at least one year
            if ($year1SourceTotal > 0 || $year2SourceTotal > 0) {
                $incomeSourceComparison[] = [
                    'id' => $source->id,
                    'name' => $source->name,
                    'color' => $source->color,
                    'year1Amount' => (float) $year1SourceTotal,
                    'year2Amount' => (float) $year2SourceTotal,
                ];
            }
        }

        return Inertia::render('YearComparison', [
            'year1' => (int) $year1,
            'year2' => (int) $year2,
            'year1Data' => [
                'totalIncome' => (float) $year1Income,
                'totalExpenses' => (float) $year1TotalExpenses,
                'totalInvestments' => (float) $year1TotalInvestments,
                'netSavings' => (float) $year1NetSavings,
            ],
            'year2Data' => [
                'totalIncome' => (float) $year2Income,
                'totalExpenses' => (float) $year2TotalExpenses,
                'totalInvestments' => (float) $year2TotalInvestments,
                'netSavings' => (float) $year2NetSavings,
            ],
            'categoryComparison' => $categoryComparison,
            'incomeSourceComparison' => $incomeSourceComparison,
        ]);
    }
}


