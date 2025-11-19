<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\IncomeEntry;
use App\Models\IncomeSource;
use App\Models\Investment;
use App\Models\StartingBalance;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->get('year', date('Y'));
        $month = $request->get('month');

        $user = Auth::user();

        // Get categories with subcategories
        $categories = Category::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('order')
            ->get();

        // Get income sources
        $incomeSources = IncomeSource::where('user_id', $user->id)
            ->orderBy('order')
            ->get();

        // Get transactions for the year/month
        $transactionsQuery = Transaction::where('user_id', $user->id)
            ->where('year', $year)
            ->with('category');

        if ($month) {
            $transactionsQuery->where('month', $month);
        }

        $transactions = $transactionsQuery->get();

        // Get income entries for the year/month
        $incomeEntriesQuery = IncomeEntry::where('user_id', $user->id)
            ->where('year', $year)
            ->with('incomeSource');

        if ($month) {
            $incomeEntriesQuery->where('month', $month);
        }

        $incomeEntries = $incomeEntriesQuery->get();

        // Get starting balance for the year
        $startingBalance = StartingBalance::where('user_id', $user->id)
            ->where('year', $year)
            ->first();

        $startingBalanceAmount = $startingBalance ? (float) $startingBalance->amount : 0;

        // Get initial investment for the year
        $initialInvestment = Investment::where('user_id', $user->id)
            ->where('year', $year)
            ->first();

        $initialInvestmentAmount = $initialInvestment ? (float) $initialInvestment->amount : 0;

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

        // Get investment transactions (these will be counted as both expenses and investments)
        $investmentTransactions = $transactions->filter(function ($transaction) use ($isInvestmentCategory) {
            return $isInvestmentCategory($transaction->category_id);
        });

        // Calculate totals
        // Separate regular expenses from investment transactions for reporting
        $regularExpenseTransactions = $transactions->filter(function ($transaction) use ($isInvestmentCategory) {
            return !$isInvestmentCategory($transaction->category_id);
        });

        // Total expenses for reporting (excluding investments)
        $totalExpenses = $regularExpenseTransactions->sum('amount');
        // All expenses including investments (for balance calculation)
        $totalExpensesIncludingInvestments = $transactions->sum('amount');

        $totalIncome = $incomeEntries->sum('amount');
        $net = $totalIncome - $totalExpenses;

        // Calculate total investments: initial investment + investment transactions
        $totalInvestments = $initialInvestmentAmount + $investmentTransactions->sum('amount');

        // Monthly breakdown with running balance
        $monthlyData = [];
        $runningBalance = $startingBalanceAmount;
        $runningInvestments = $initialInvestmentAmount;
        for ($m = 1; $m <= 12; $m++) {
            // Get all transactions for this month
            $monthAllTransactions = Transaction::where('user_id', $user->id)
                ->where('year', $year)
                ->where('month', $m)
                ->get();

            // Separate regular expenses from investment transactions for reporting
            $monthRegularExpenseTransactions = $monthAllTransactions->filter(function ($transaction) use ($isInvestmentCategory) {
                return !$isInvestmentCategory($transaction->category_id);
            });
            $monthExpenses = $monthRegularExpenseTransactions->sum('amount');

            // Investment transactions are tracked separately
            $monthInvestmentTransactions = $monthAllTransactions->filter(function ($transaction) use ($isInvestmentCategory) {
                return $isInvestmentCategory($transaction->category_id);
            });
            $monthInvestments = $monthInvestmentTransactions->sum('amount');

            $monthIncome = IncomeEntry::where('user_id', $user->id)
                ->where('year', $year)
                ->where('month', $m)
                ->sum('amount');

            // Net for reporting (income minus regular expenses only)
            $monthNet = (float) $monthIncome - (float) $monthExpenses;

            // Net for balance calculation (income minus ALL expenses including investments)
            // This is what actually leaves/enters the bank account
            $monthNetForBalance = (float) $monthIncome - (float) $monthAllTransactions->sum('amount');

            // Calculate running balance: previous balance + income - ALL expenses (including investments)
            // Investments reduce the balance because money leaves the bank account
            $runningBalance += $monthNetForBalance;

            // Calculate running investments: previous investments + new investment transactions
            $runningInvestments += (float) $monthInvestments;

            $monthlyData[] = [
                'month' => $m,
                'monthName' => date('F', mktime(0, 0, 0, $m, 1)),
                'expenses' => (float) $monthExpenses,
                'income' => (float) $monthIncome,
                'investments' => (float) $monthInvestments,
                'net' => $monthNet,
                'netSavings' => $monthNet, // Net savings is the same as net
                'balance' => (float) $runningBalance,
                'totalInvestments' => (float) $runningInvestments,
                'netWorth' => (float) $runningBalance + (float) $runningInvestments,
            ];
        }

        // Category breakdown with totals and averages
        // Categories don't have direct transactions - only subcategories do
        // So we sum up all subcategory totals to get the category total
        $categoryBreakdown = [];

        foreach ($categories as $category) {
            $categoryTotal = 0;
            $categoryMonthsWithExpenses = [];
            $subcategoryTotals = [];

            // Calculate totals for each subcategory and track months with expenses
            foreach ($category->children as $subcategory) {
                $subTransactions = Transaction::where('user_id', $user->id)
                    ->where('year', $year)
                    ->where('category_id', $subcategory->id);

                if ($month) {
                    $subTransactions->where('month', $month);
                }

                // Count all transactions as expenses (including investments)
                $subTransactionsList = $subTransactions->get();
                $subTotal = $subTransactionsList->sum('amount');

                // Get months that have expenses for this subcategory (including investments)
                $subMonthsWithExpenses = Transaction::where('user_id', $user->id)
                    ->where('year', $year)
                    ->where('category_id', $subcategory->id)
                    ->when($month, fn($q) => $q->where('month', $month))
                    ->distinct()
                    ->pluck('month')
                    ->toArray();

                // Track all months with expenses for this category
                $categoryMonthsWithExpenses = array_unique(
                    array_merge($categoryMonthsWithExpenses, $subMonthsWithExpenses)
                );

                // Calculate average based on months with expenses
                $monthsCount = count($categoryMonthsWithExpenses) > 0
                    ? count($categoryMonthsWithExpenses)
                    : 1;
                $subAverage = $subTotal > 0 ? $subTotal / $monthsCount : 0;

                // Add subcategory total to category total
                $categoryTotal += $subTotal;

                if ($subTotal > 0) {
                    $subcategoryTotals[] = [
                        'id' => $subcategory->id,
                        'name' => $subcategory->name,
                        'amount' => (float) $subTotal,
                        'average' => (float) $subAverage,
                        'color' => $subcategory->color,
                    ];
                }
            }

            // Calculate category average based on months with expenses
            $monthsWithExpensesCount = count($categoryMonthsWithExpenses) > 0
                ? count($categoryMonthsWithExpenses)
                : 1;
            $categoryAverage = $categoryTotal > 0
                ? $categoryTotal / $monthsWithExpensesCount
                : 0;

            // Only include categories that have expenses
            if ($categoryTotal > 0) {
                $categoryBreakdown[] = [
                    'id' => $category->id,
                    'name' => $category->name,
                    'amount' => (float) $categoryTotal,
                    'average' => (float) $categoryAverage,
                    'color' => $category->color,
                ];
            }
        }

        // Income source breakdown
        $incomeSourceBreakdown = [];
        foreach ($incomeSources as $source) {
            $sourceTotal = $incomeEntries
                ->where('income_source_id', $source->id)
                ->sum('amount');

            if ($sourceTotal > 0) {
                $incomeSourceBreakdown[] = [
                    'id' => $source->id,
                    'name' => $source->name,
                    'amount' => (float) $sourceTotal,
                    'color' => $source->color,
                ];
            }
        }

        // Expenses per category per month
        $expensesPerCategoryPerMonth = [];
        foreach ($categories as $category) {
            $categoryMonthlyData = [];
            $categoryTotal = 0;

            // Calculate expenses for each month
            for ($m = 1; $m <= 12; $m++) {
                $monthTotal = 0;

                // Sum all subcategory expenses for this month (including investments)
                foreach ($category->children as $subcategory) {
                    $monthExpenses = Transaction::where('user_id', $user->id)
                        ->where('year', $year)
                        ->where('month', $m)
                        ->where('category_id', $subcategory->id)
                        ->sum('amount');

                    $monthTotal += (float) $monthExpenses;
                }

                $categoryMonthlyData[] = $monthTotal;
                $categoryTotal += $monthTotal;
            }

            // Include all categories, even if they have 0 expenses (so user can see all categories)
            $expensesPerCategoryPerMonth[] = [
                'id' => $category->id,
                'name' => $category->name,
                'color' => $category->color,
                'monthlyExpenses' => $categoryMonthlyData,
                'total' => $categoryTotal,
            ];
        }

        $currentBalance = $monthlyData[count($monthlyData) - 1]['balance'] ?? $startingBalanceAmount;
        $currentTotalInvestments = $monthlyData[count($monthlyData) - 1]['totalInvestments'] ?? $initialInvestmentAmount;
        $netWorth = $currentBalance + $currentTotalInvestments;

        return Inertia::render('Dashboard', [
            'year' => (int) $year,
            'month' => $month ? (int) $month : null,
            'categories' => $categories,
            'incomeSources' => $incomeSources,
            'startingBalance' => $startingBalanceAmount,
            'initialInvestment' => $initialInvestmentAmount,
            'summary' => [
                'totalIncome' => (float) $totalIncome,
                'totalExpenses' => (float) $totalExpenses,
                'totalInvestments' => (float) $totalInvestments,
                'net' => (float) $net,
                'currentBalance' => (float) $currentBalance,
                'netWorth' => (float) $netWorth,
            ],
            'monthlyData' => $monthlyData,
            'categoryBreakdown' => $categoryBreakdown,
            'incomeSourceBreakdown' => $incomeSourceBreakdown,
            'expensesPerCategoryPerMonth' => $expensesPerCategoryPerMonth,
        ]);
    }
}
