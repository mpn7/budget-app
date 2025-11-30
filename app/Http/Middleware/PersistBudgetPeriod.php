<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PersistBudgetPeriod
{
    /**
     * Handle an incoming request.
     *
     * Store year and month in session for persistence across pages.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If year is provided in the request, store it in session
        if ($request->has('year')) {
            $request->session()->put('budget_year', $request->get('year'));
        }

        // If month is provided in the request, store it in session
        if ($request->has('month')) {
            $request->session()->put('budget_month', $request->get('month'));
        }

        // If month is explicitly null (cleared), remove from session
        if ($request->has('month') && $request->get('month') === null) {
            $request->session()->forget('budget_month');
        }

        return $next($request);
    }
}

