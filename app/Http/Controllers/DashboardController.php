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

        // Calculate trends for the most recent complete month
        $currentMonth = (int) date('n');
        $lastCompleteMonth = $currentMonth > 1 ? $currentMonth - 1 : 12;
        $lastCompleteYear = $currentMonth > 1 ? $year : $year - 1;

        // Get current month data
        $currentMonthExpenses = Transaction::where('user_id', $user->id)
            ->where('year', $year)
            ->where('month', $currentMonth)
            ->sum('amount');

        $currentMonthIncome = IncomeEntry::where('user_id', $user->id)
            ->where('year', $year)
            ->where('month', $currentMonth)
            ->sum('amount');

        // Get previous month data
        $previousMonthExpenses = Transaction::where('user_id', $user->id)
            ->where('year', $lastCompleteYear)
            ->where('month', $lastCompleteMonth)
            ->sum('amount');

        $previousMonthIncome = IncomeEntry::where('user_id', $user->id)
            ->where('year', $lastCompleteYear)
            ->where('month', $lastCompleteMonth)
            ->sum('amount');

        // Get last year same month data for YoY comparison
        $lastYearMonth = $month ?: $currentMonth;
        $lastYearExpenses = Transaction::where('user_id', $user->id)
            ->where('year', $year - 1)
            ->where('month', $lastYearMonth)
            ->sum('amount');

        $lastYearIncome = IncomeEntry::where('user_id', $user->id)
            ->where('year', $year - 1)
            ->where('month', $lastYearMonth)
            ->sum('amount');

        // Calculate percentage changes
        $expensesMoMChange = $previousMonthExpenses > 0
            ? (($currentMonthExpenses - $previousMonthExpenses) / $previousMonthExpenses) * 100
            : 0;

        $incomeMoMChange = $previousMonthIncome > 0
            ? (($currentMonthIncome - $previousMonthIncome) / $previousMonthIncome) * 100
            : 0;

        $expensesYoYChange = $lastYearExpenses > 0
            ? (($currentMonthExpenses - $lastYearExpenses) / $lastYearExpenses) * 100
            : 0;

        $incomeYoYChange = $lastYearIncome > 0
            ? (($currentMonthIncome - $lastYearIncome) / $lastYearIncome) * 100
            : 0;

        // Get previous month's investment and net worth data
        $previousMonthData = null;
        if ($currentMonth > 1) {
            $previousMonthData = $monthlyData[$currentMonth - 2] ?? null;
        } elseif ($currentMonth === 1 && $year > date('Y') - 5) {
            // Get December of previous year if available - would need to fetch from previous year's data
            // For now, use initial values
            $previousMonthData = null;
        }

        $previousNetWorth = $previousMonthData ? ($previousMonthData['netWorth'] ?? 0) : 0;
        $previousInvestments = $previousMonthData ? ($previousMonthData['totalInvestments'] ?? 0) : 0;

        // Calculate percentage changes with proper handling of zero values
        // When going from 0 to positive, show as 100% increase
        // When going from positive to 0, show as -100% decrease
        if ($previousNetWorth > 0) {
            $netWorthChange = (($netWorth - $previousNetWorth) / $previousNetWorth) * 100;
        } elseif ($netWorth > 0 && $previousNetWorth == 0) {
            $netWorthChange = 100; // Started from nothing, now have something
        } else {
            $netWorthChange = 0; // Both are zero or current is zero
        }

        if ($previousInvestments > 0) {
            $investmentsChange = (($currentTotalInvestments - $previousInvestments) / $previousInvestments) * 100;
        } elseif ($currentTotalInvestments > 0 && $previousInvestments == 0) {
            $investmentsChange = 100; // Started investing
        } else {
            $investmentsChange = 0;
        }

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
            'trends' => [
                'currentMonthExpenses' => (float) $currentMonthExpenses,
                'previousMonthExpenses' => (float) $previousMonthExpenses,
                'expensesMoMChange' => round($expensesMoMChange, 1),
                'currentMonthIncome' => (float) $currentMonthIncome,
                'previousMonthIncome' => (float) $previousMonthIncome,
                'incomeMoMChange' => round($incomeMoMChange, 1),
                'expensesYoYChange' => round($expensesYoYChange, 1),
                'incomeYoYChange' => round($incomeYoYChange, 1),
                'netWorthChange' => round($netWorthChange, 1),
                'previousNetWorth' => (float) $previousNetWorth,
                'investmentsChange' => round($investmentsChange, 1),
                'previousInvestments' => (float) $previousInvestments,
            ],
            'monthlyData' => $monthlyData,
            'categoryBreakdown' => $categoryBreakdown,
            'incomeSourceBreakdown' => $incomeSourceBreakdown,
            'expensesPerCategoryPerMonth' => $expensesPerCategoryPerMonth,
        ]);
    }
}
