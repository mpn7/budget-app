<?php

namespace App\Http\Controllers;

use App\Models\IncomeEntry;
use App\Models\IncomeSource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IncomeEntryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Redirect to bulk entry page
        $year = $request->get('year', date('Y'));
        $month = $request->get('month', date('n'));

        return redirect()->route('income-entries.create', [
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

        // Get all income sources
        $incomeSources = IncomeSource::where('user_id', Auth::id())
            ->orderBy('order')
            ->get();

        // Get existing income entries for this month/year
        $existingIncomeEntries = IncomeEntry::where('user_id', Auth::id())
            ->where('year', $year)
            ->where('month', $month)
            ->with('incomeSource')
            ->get()
            ->groupBy('income_source_id')
            ->toArray();

        // Calculate total income for this month/year
        $totalIncome = IncomeEntry::where('user_id', Auth::id())
            ->where('year', $year)
            ->where('month', $month)
            ->sum('amount');

        return Inertia::render('Income/Create', [
            'incomeSources' => $incomeSources,
            'year' => (int) $year,
            'month' => (int) $month,
            'existingIncomeEntries' => $existingIncomeEntries,
            'totalIncome' => (float) $totalIncome,
        ]);
    }

    /**
     * Store or update a single income entry for an income source.
     */
    public function storeSingle(Request $request)
    {
        $validated = $request->validate([
            'income_source_id' => [
                'required',
                Rule::exists('income_sources', 'id')->where('user_id', Auth::id()),
            ],
            'amount' => 'nullable|numeric|min:0',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        // Delete existing income entries for this source/month/year
        IncomeEntry::where('user_id', Auth::id())
            ->where('income_source_id', $validated['income_source_id'])
            ->where('year', $validated['year'])
            ->where('month', $validated['month'])
            ->delete();

        // If amount is provided and > 0, create a new income entry
        if (isset($validated['amount']) && $validated['amount'] > 0) {
            IncomeEntry::create([
                'user_id' => Auth::id(),
                'income_source_id' => $validated['income_source_id'],
                'amount' => $validated['amount'],
                'description' => null,
                'month' => $validated['month'],
                'year' => $validated['year'],
            ]);
        }

        return redirect()
            ->route('income-entries.create', [
                'year' => $validated['year'],
                'month' => $validated['month'],
            ]);
    }
}
