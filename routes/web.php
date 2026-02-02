<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IncomeEntryController;
use App\Http\Controllers\IncomeSourceController;
use App\Http\Controllers\InvestmentsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StartingBalanceController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\YearComparisonController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Year Comparison
    Route::get('/year-comparison', [YearComparisonController::class, 'index'])->name('year-comparison');

    // Investments
    Route::get('/investments', [InvestmentsController::class, 'index'])->name('investments.index');

    // Categories
    Route::get(
        '/categories/create',
        [CategoryController::class, 'create']
    )->name('categories.create');
    Route::resource('categories', CategoryController::class);

    // Income Sources
    Route::get(
        '/income-sources/create',
        [IncomeSourceController::class, 'create']
    )->name('income-sources.create');
    Route::apiResource('income-sources', IncomeSourceController::class);

    // Transactions
    Route::get(
        '/transactions',
        [TransactionController::class, 'index']
    )->name('transactions.index');
    Route::get(
        '/transactions/create',
        [TransactionController::class, 'create']
    )->name('transactions.create');
    Route::post(
        '/transactions/single',
        [TransactionController::class, 'storeSingle']
    )->name('transactions.single');

    // Income Entries
    Route::get(
        '/income-entries',
        [IncomeEntryController::class, 'index']
    )->name('income-entries.index');
    Route::get(
        '/income-entries/create',
        [IncomeEntryController::class, 'create']
    )->name('income-entries.create');
    Route::post(
        '/income-entries/single',
        [IncomeEntryController::class, 'storeSingle']
    )->name('income-entries.single');

    // Settings
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post(
        '/settings/starting-balance',
        [SettingsController::class, 'storeStartingBalance']
    )->name('settings.starting-balance');

    // Starting Balance (kept for backward compatibility, redirects to settings)
    Route::post(
        '/starting-balance',
        [StartingBalanceController::class, 'store']
    )->name('starting-balance.store');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
