<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Redirect to bulk entry page using session values
        $year = $request->session()->get('budget_year', date('Y'));
        $month = $request->session()->get('budget_month', date('n'));

        return redirect()->route('transactions.create', [
            'year' => $year,
            'month' => $month,
        ]);
    }

    /**
     * Show the bulk entry form.
     */
    public function create(Request $request)
    {
        // Get year/month from request or session
        $year = $request->get('year', $request->session()->get('budget_year', date('Y')));
        $month = $request->get('month', $request->session()->get('budget_month', date('n')));

        // Store in session for persistence
        $request->session()->put('budget_year', $year);
        $request->session()->put('budget_month', $month);

        // Get all categories (parents and children)
        $categories = Category::where('user_id', Auth::id())
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('order')
            ->get();

        // Calculate the months to display: previous 2, current, and next 1
        $months = [];
        for ($i = -2; $i <= 1; $i++) {
            $date = new \DateTime("{$year}-{$month}-01");
            $date->modify("{$i} months");
            $months[] = [
                'year' => (int) $date->format('Y'),
                'month' => (int) $date->format('n'),
                'monthName' => $date->format('F'),
                'yearName' => $date->format('Y'),
            ];
        }

        // Get existing transactions for all 4 months
        $transactionsByMonth = [];
        foreach ($months as $monthData) {
            $monthTransactions = Transaction::where('user_id', Auth::id())
                ->where('year', $monthData['year'])
                ->where('month', $monthData['month'])
                ->with('category')
                ->get()
                ->groupBy('category_id')
                ->toArray();

            $transactionsByMonth["{$monthData['year']}-{$monthData['month']}"] = $monthTransactions;
        }

        return Inertia::render('Transactions/Create', [
            'categories' => $categories,
            'year' => (int) $year,
            'month' => (int) $month,
            'months' => $months,
            'transactionsByMonth' => $transactionsByMonth,
        ]);
    }

    /**
     * Store or update a single transaction for a category.
     */
    public function storeSingle(Request $request)
    {
        $validated = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('user_id', Auth::id()),
            ],
            'amount' => 'nullable|numeric|min:0',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        // Delete existing transactions for this category/month/year
        Transaction::where('user_id', Auth::id())
            ->where('category_id', $validated['category_id'])
            ->where('year', $validated['year'])
            ->where('month', $validated['month'])
            ->delete();

        // If amount is provided and > 0, create a new transaction
        if (isset($validated['amount']) && $validated['amount'] > 0) {
            Transaction::create([
                'user_id' => Auth::id(),
                'category_id' => $validated['category_id'],
                'amount' => $validated['amount'],
                'description' => null,
                'month' => $validated['month'],
                'year' => $validated['year'],
            ]);
        }

        // If this is an AJAX request (from fetch), return JSON
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Transaction saved successfully',
            ]);
        }

        // Otherwise redirect back (for backwards compatibility)
        $sessionYear = $request->session()->get('budget_year', date('Y'));
        $sessionMonth = $request->session()->get('budget_month', date('n'));

        return redirect()
            ->route('transactions.create', [
                'year' => $sessionYear,
                'month' => $sessionMonth,
            ]);
    }
}
