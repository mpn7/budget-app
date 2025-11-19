<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InvestmentController extends Controller
{
    /**
     * Store or update an initial investment for a year.
     */
    public function store(Request $request)
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
            ->route('dashboard', ['year' => $validated['year']])
            ->with('success', 'Initial investment updated successfully.');
    }
}
