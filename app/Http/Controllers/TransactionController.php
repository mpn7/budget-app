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
        // Redirect to bulk entry page
        $year = $request->get('year', date('Y'));
        $month = $request->get('month', date('n'));

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
        $year = $request->get('year', date('Y'));
        $month = $request->get('month', date('n'));

        // Get all categories (parents and children)
        $categories = Category::where('user_id', Auth::id())
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('order')
            ->get();

        // Get existing transactions for this month/year
        $existingTransactions = Transaction::where('user_id', Auth::id())
            ->where('year', $year)
            ->where('month', $month)
            ->with('category')
            ->get()
            ->groupBy('category_id')
            ->toArray();

        // Calculate total expenses for this month/year
        $totalExpenses = Transaction::where('user_id', Auth::id())
            ->where('year', $year)
            ->where('month', $month)
            ->sum('amount');

        return Inertia::render('Transactions/Create', [
            'categories' => $categories,
            'year' => (int) $year,
            'month' => (int) $month,
            'existingTransactions' => $existingTransactions,
            'totalExpenses' => (float) $totalExpenses,
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

        return redirect()
            ->route('transactions.create', [
                'year' => $validated['year'],
                'month' => $validated['month'],
            ]);
    }
}
