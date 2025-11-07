<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IncomeEntryController;
use App\Http\Controllers\IncomeSourceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StartingBalanceController;
use App\Http\Controllers\TransactionController;
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

    // Categories
    Route::get(
        '/categories/create',
        [CategoryController::class, 'create']
    )->name('categories.create');
    Route::apiResource('categories', CategoryController::class);

    // Income Sources
    Route::get(
        '/income-sources/create',
        [IncomeSourceController::class, 'create']
    )->name('income-sources.create');
    Route::apiResource('income-sources', IncomeSourceController::class);

    // Transactions
    Route::get(
        '/transactions/create',
        [TransactionController::class, 'create']
    )->name('transactions.create');
    Route::post(
        '/transactions/bulk',
        [TransactionController::class, 'storeBulk']
    )->name('transactions.bulk');
    Route::apiResource('transactions', TransactionController::class);

    // Income Entries
    Route::get(
        '/income-entries/create',
        [IncomeEntryController::class, 'create']
    )->name('income-entries.create');
    Route::post(
        '/income-entries/bulk',
        [IncomeEntryController::class, 'storeBulk']
    )->name('income-entries.bulk');
    Route::apiResource('income-entries', IncomeEntryController::class);

    // Starting Balance
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
