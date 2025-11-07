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

    /**
     * Store multiple income entries at once.
     */
    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'income_entries' => 'required|array|min:1',
            'income_entries.*.income_source_id' => [
                'required',
                Rule::exists('income_sources', 'id')->where('user_id', Auth::id()),
            ],
            'income_entries.*.amount' => 'required|numeric|min:0.01',
            'income_entries.*.description' => 'nullable|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        // Delete existing income entries for this month/year
        IncomeEntry::where('user_id', Auth::id())
            ->where('year', $validated['year'])
            ->where('month', $validated['month'])
            ->delete();

        // Insert new income entries
        $incomeEntries = [];
        foreach ($validated['income_entries'] as $entryData) {
            if (empty($entryData['amount']) || $entryData['amount'] <= 0) {
                continue; // Skip empty amounts
            }

            $incomeEntries[] = [
                'user_id' => Auth::id(),
                'income_source_id' => $entryData['income_source_id'],
                'amount' => $entryData['amount'],
                'description' => $entryData['description'] ?? null,
                'month' => $validated['month'],
                'year' => $validated['year'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($incomeEntries)) {
            IncomeEntry::insert($incomeEntries);
        }

        return redirect()
            ->route('income-entries.create', [
                'year' => $validated['year'],
                'month' => $validated['month'],
            ])
            ->with('success', count($incomeEntries) . ' income entries saved successfully.');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'income_source_id' => [
                'required',
                Rule::exists('income_sources', 'id')->where('user_id', Auth::id()),
            ],
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
            'date' => 'nullable|date',
        ]);

        $validated['user_id'] = Auth::id();

        $incomeEntry = IncomeEntry::create($validated);

        if ($request->wantsJson()) {
            return response()->json($incomeEntry->load('incomeSource'), 201);
        }

        return redirect()
            ->route('income-entries.index')
            ->with('success', 'Income entry created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(IncomeEntry $incomeEntry)
    {
        if ($incomeEntry->user_id !== Auth::id()) {
            abort(403);
        }

        $incomeEntry->load('incomeSource');

        if (request()->wantsJson()) {
            return response()->json($incomeEntry);
        }

        return redirect()->route('income-entries.index');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, IncomeEntry $incomeEntry)
    {
        if ($incomeEntry->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'income_source_id' => [
                'required',
                Rule::exists('income_sources', 'id')->where('user_id', Auth::id()),
            ],
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
            'date' => 'nullable|date',
        ]);

        $incomeEntry->update($validated);

        if ($request->wantsJson()) {
            return response()->json($incomeEntry->load('incomeSource'));
        }

        return redirect()
            ->route('income-entries.index')
            ->with('success', 'Income entry updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IncomeEntry $incomeEntry)
    {
        if ($incomeEntry->user_id !== Auth::id()) {
            abort(403);
        }

        $incomeEntry->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Income entry deleted successfully']);
        }

        return redirect()
            ->route('income-entries.index')
            ->with('success', 'Income entry deleted successfully.');
    }
}
