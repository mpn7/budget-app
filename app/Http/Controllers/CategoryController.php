<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categories = Category::where('user_id', Auth::id())
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('order')
            ->get();

        if (request()->wantsJson()) {
            return response()->json($categories);
        }

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $parentCategories = Category::where('user_id', Auth::id())
            ->whereNull('parent_id')
            ->orderBy('order')
            ->get();

        return Inertia::render('Categories/Create', [
            'parentCategories' => $parentCategories,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category)
    {
        if ($category->user_id !== Auth::id()) {
            abort(403);
        }

        $category->load('parent', 'children');

        if (request()->wantsJson()) {
            return response()->json($category);
        }

        return redirect()->route('categories.index');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where('user_id', Auth::id()),
            ],
            'color' => 'nullable|string|max:7',
            'order' => 'nullable|integer',
            'is_investment' => 'nullable|boolean',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['color'] = $validated['color'] ?? '#8B5CF6';
        $validated['order'] = $validated['order'] ?? 0;

        $category = Category::create($validated);

        if ($request->wantsJson()) {
            return response()->json($category->load('parent', 'children'), 201);
        }

        return redirect()
            ->route('categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category)
    {
        if ($category->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where('user_id', Auth::id()),
            ],
            'color' => 'nullable|string|max:7',
            'order' => 'nullable|integer',
            'is_investment' => 'nullable|boolean',
        ]);

        $category->update($validated);

        if ($request->wantsJson()) {
            return response()->json($category->load('parent', 'children'));
        }

        return redirect()
            ->route('categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category)
    {
        if ($category->user_id !== Auth::id()) {
            abort(403);
        }

        $category->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Category deleted successfully']);
        }

        return redirect()
            ->route('categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
