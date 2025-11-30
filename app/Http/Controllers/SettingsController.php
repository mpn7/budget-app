<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use App\Models\StartingBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display the settings page.
     */
    public function index(Request $request)
    {
        // Get year from request or session, defaulting to current year
        $year = $request->get('year', $request->session()->get('budget_year', date('Y')));
        
        // Store in session for persistence
        $request->session()->put('budget_year', $year);
        
        $user = Auth::user();

        $startingBalance = StartingBalance::where('user_id', $user->id)
            ->where('year', $year)
            ->first();

        $initialInvestment = Investment::where('user_id', $user->id)
            ->where('year', $year)
            ->first();

        return Inertia::render('Settings/Index', [
            'year' => (int) $year,
            'startingBalance' => $startingBalance ? (float) $startingBalance->amount : 0,
            'initialInvestment' => $initialInvestment ? (float) $initialInvestment->amount : 0,
        ]);
    }

    /**
     * Store or update starting balance.
     */
    public function storeStartingBalance(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'amount' => 'required|numeric',
        ]);

        StartingBalance::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'year' => $validated['year'],
            ],
            [
                'amount' => $validated['amount'],
            ]
        );

        return redirect()
            ->route('settings.index', ['year' => $validated['year']])
            ->with('success', 'Starting balance updated successfully.');
    }

    /**
     * Store or update initial investment.
     */
    public function storeInitialInvestment(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'amount' => 'required|numeric',
        ]);

        Investment::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'year' => $validated['year'],
            ],
            [
                'amount' => $validated['amount'],
            ]
        );

        return redirect()
            ->route('settings.index', ['year' => $validated['year']])
            ->with('success', 'Initial investment updated successfully.');
    }
}
