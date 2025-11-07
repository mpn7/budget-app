<?php

namespace App\Http\Controllers;

use App\Models\IncomeSource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class IncomeSourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $incomeSources = IncomeSource::where('user_id', Auth::id())
            ->orderBy('order')
            ->get();

        if (request()->wantsJson()) {
            return response()->json($incomeSources);
        }

        return Inertia::render('IncomeSources/Index', [
            'incomeSources' => $incomeSources,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('IncomeSources/Create');
    }

    /**
     * Display the specified resource.
     */
    public function show(IncomeSource $incomeSource)
    {
        if ($incomeSource->user_id !== Auth::id()) {
            abort(403);
        }

        if (request()->wantsJson()) {
            return response()->json($incomeSource);
        }

        return redirect()->route('income-sources.index');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:7',
            'order' => 'nullable|integer',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['color'] = $validated['color'] ?? '#8B5CF6';
        $validated['order'] = $validated['order'] ?? 0;

        $incomeSource = IncomeSource::create($validated);

        if ($request->wantsJson()) {
            return response()->json($incomeSource, 201);
        }

        return redirect()
            ->route('income-sources.index')
            ->with('success', 'Income source created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, IncomeSource $incomeSource)
    {
        if ($incomeSource->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:7',
            'order' => 'nullable|integer',
        ]);

        $incomeSource->update($validated);

        if ($request->wantsJson()) {
            return response()->json($incomeSource);
        }

        return redirect()
            ->route('income-sources.index')
            ->with('success', 'Income source updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IncomeSource $incomeSource)
    {
        if ($incomeSource->user_id !== Auth::id()) {
            abort(403);
        }

        $incomeSource->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Income source deleted successfully']);
        }

        return redirect()
            ->route('income-sources.index')
            ->with('success', 'Income source deleted successfully.');
    }
}
