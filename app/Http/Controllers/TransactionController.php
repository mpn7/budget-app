<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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
     * Store multiple transactions at once.
     */
    public function storeBulk(Request $request)
    {
        // Debug: Log what we're receiving
        Log::info('StoreBulk Request Data:', [
            'all' => $request->all(),
            'transactions' => $request->get('transactions'),
            'month' => $request->get('month'),
            'year' => $request->get('year'),
        ]);

        $validated = $request->validate([
            'transactions' => 'required|array|min:1',
            'transactions.*.category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('user_id', Auth::id()),
            ],
            'transactions.*.amount' => 'required|numeric|min:0.01',
            'transactions.*.description' => 'nullable|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        // Delete existing transactions for this month/year
        Transaction::where('user_id', Auth::id())
            ->where('year', $validated['year'])
            ->where('month', $validated['month'])
            ->delete();

        // Insert new transactions
        $transactions = [];
        foreach ($validated['transactions'] as $transactionData) {
            if (empty($transactionData['amount']) || $transactionData['amount'] <= 0) {
                continue; // Skip empty amounts
            }

            $transactions[] = [
                'user_id' => Auth::id(),
                'category_id' => $transactionData['category_id'],
                'amount' => $transactionData['amount'],
                'description' => $transactionData['description'] ?? null,
                'month' => $validated['month'],
                'year' => $validated['year'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($transactions)) {
            Transaction::insert($transactions);
        }

        return redirect()
            ->route('transactions.create', [
                'year' => $validated['year'],
                'month' => $validated['month'],
            ])
            ->with('success', count($transactions) . ' expenses saved successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Transaction $transaction)
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $transaction->load('category');

        if (request()->wantsJson()) {
            return response()->json($transaction);
        }

        return redirect()->route('transactions.index');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('user_id', Auth::id()),
            ],
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
            'date' => 'nullable|date',
        ]);

        $validated['user_id'] = Auth::id();

        $transaction = Transaction::create($validated);

        if ($request->wantsJson()) {
            return response()->json($transaction->load('category'), 201);
        }

        return redirect()
            ->route('transactions.index')
            ->with('success', 'Transaction created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('user_id', Auth::id()),
            ],
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
            'date' => 'nullable|date',
        ]);

        $transaction->update($validated);

        if ($request->wantsJson()) {
            return response()->json($transaction->load('category'));
        }

        return redirect()
            ->route('transactions.index')
            ->with('success', 'Transaction updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Transaction $transaction)
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $transaction->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Transaction deleted successfully']);
        }

        return redirect()
            ->route('transactions.index')
            ->with('success', 'Transaction deleted successfully.');
    }
}
