<?php

namespace App\Http\Controllers;

use App\Models\StartingBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StartingBalanceController extends Controller
{
    /**
     * Store or update a starting balance for a year.
     */
    public function store(Request $request)
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
            ->route('dashboard', ['year' => $validated['year']])
            ->with('success', 'Starting balance updated successfully.');
    }
}
