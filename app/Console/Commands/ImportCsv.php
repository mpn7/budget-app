<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\IncomeEntry;
use App\Models\IncomeSource;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportCsv extends Command
{
    protected $signature = 'budget:import-csv 
                            {year : The year to import data for}
                            {--user= : User ID to import for (defaults to first user)}
                            {--expenses= : Path to expenses CSV file}
                            {--income= : Path to income CSV file}
                            {--dry-run : Preview import without saving to database}';

    protected $description = 'Import budget data from CSV files (expenses and income)';

    protected User $user;
    protected array $categoryMap = [];
    protected array $incomeSourceMap = [];
    protected array $createdCategories = [];
    protected array $createdIncomeSources = [];
    protected int $year;
    protected bool $dryRun = false;

    // Track statistics
    protected array $stats = [
        'expenses' => ['created' => 0, 'skipped' => 0, 'errors' => 0],
        'income' => ['created' => 0, 'skipped' => 0, 'errors' => 0],
    ];

    public function handle()
    {
        $this->year = (int) $this->argument('year');
        $this->dryRun = $this->option('dry-run');

        // Get user
        $userId = $this->option('user');
        $this->user = $userId ? User::findOrFail($userId) : User::first();

        if (!$this->user) {
            $this->error('No users found in database. Please create a user first.');
            return 1;
        }

        $this->info("Importing data for year {$this->year} for user: {$this->user->name}");
        if ($this->dryRun) {
            $this->warn('DRY RUN MODE - No data will be saved');
        }

        // Build category and income source maps
        $this->buildMaps();

        // Import expenses
        if ($expensesFile = $this->option('expenses')) {
            $this->newLine();
            $this->info('📊 Processing expenses file: ' . $expensesFile);
            $this->importExpenses($expensesFile);
        }

        // Import income
        if ($incomeFile = $this->option('income')) {
            $this->newLine();
            $this->info('💰 Processing income file: ' . $incomeFile);
            $this->importIncome($incomeFile);
        }

        // Display summary
        $this->displaySummary();

        return 0;
    }

    protected function buildMaps(): void
    {
        // Build category map (name -> category)
        // Include ALL categories (both parents and children)
        $categories = Category::where('user_id', $this->user->id)->get();
        foreach ($categories as $category) {
            $key = $this->normalizeKey($category->name);
            
            // If multiple categories have the same name, prefer the one that matches the context
            // Store as array to handle duplicates
            if (!isset($this->categoryMap[$key])) {
                $this->categoryMap[$key] = [];
            }
            $this->categoryMap[$key][] = $category;
        }

        // Build income source map
        $incomeSources = IncomeSource::where('user_id', $this->user->id)->get();
        foreach ($incomeSources as $source) {
            $key = $this->normalizeKey($source->name);
            $this->incomeSourceMap[$key] = $source;
        }
    }

    protected function importExpenses(string $filePath): void
    {
        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return;
        }

        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->error("Could not open file: {$filePath}");
            return;
        }

        $currentParentCategory = null;
        $headerRow = null;
        $lineNumber = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;

            // Skip empty rows
            if ($this->isEmptyRow($row)) {
                continue;
            }

            // Find header row (contains "Jan", "Feb", etc.)
            if (!$headerRow && $this->isHeaderRow($row)) {
                $headerRow = $row;
                continue;
            }

            if (!$headerRow) {
                continue;
            }

            // Check if this is a category row (has data in column 0 or 2)
            $categoryName = trim($row[0] ?? '');
            $subcategoryName = trim($row[2] ?? '');

            // If we have a category name in first column, it's a parent category
            if (!empty($categoryName) && $categoryName !== 'Expenses') {
                $currentParentCategory = $this->getOrCreateCategory($categoryName);
                continue;
            }

            // If we have a subcategory name and it's not "Monthly totals:"
            if (!empty($subcategoryName) && $subcategoryName !== 'Monthly totals:' && $currentParentCategory) {
                // Process this subcategory row
                $category = $this->getOrCreateCategory($subcategoryName, $currentParentCategory);
                
                // Parse amounts for each month (columns 3-14 are Jan-Dec)
                for ($month = 1; $month <= 12; $month++) {
                    $columnIndex = 2 + $month; // Column 3 is Jan, 4 is Feb, etc.
                    $amountStr = trim($row[$columnIndex] ?? '');
                    
                    if (empty($amountStr) || $amountStr === '$0') {
                        continue;
                    }

                    $amount = $this->parseAmount($amountStr);
                    if ($amount > 0) {
                        $this->createTransaction($category, $amount, $month, $subcategoryName);
                    }
                }
            }
        }

        fclose($handle);
    }

    protected function importIncome(string $filePath): void
    {
        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return;
        }

        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->error("Could not open file: {$filePath}");
            return;
        }

        $currentParentSource = null;
        $headerRow = null;
        $lineNumber = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;

            // Skip empty rows
            if ($this->isEmptyRow($row)) {
                continue;
            }

            // Find header row
            if (!$headerRow && $this->isHeaderRow($row)) {
                $headerRow = $row;
                continue;
            }

            if (!$headerRow) {
                continue;
            }

            // Check for parent source name in first column
            $sourceName = trim($row[0] ?? '');
            $subsourceName = trim($row[2] ?? '');

            if (!empty($sourceName) && $sourceName !== 'Income') {
                $currentParentSource = $sourceName;
                continue;
            }

            // Process subsource rows
            if (!empty($subsourceName) && $subsourceName !== 'Monthly totals:' && $currentParentSource) {
                $incomeSource = $this->getOrCreateIncomeSource($subsourceName);
                
                // Parse amounts for each month
                for ($month = 1; $month <= 12; $month++) {
                    $columnIndex = 2 + $month;
                    $amountStr = trim($row[$columnIndex] ?? '');
                    
                    if (empty($amountStr) || $amountStr === '$0') {
                        continue;
                    }

                    $amount = $this->parseAmount($amountStr);
                    if ($amount > 0) {
                        $this->createIncomeEntry($incomeSource, $amount, $month, $subsourceName);
                    }
                }
            }
        }

        fclose($handle);
    }

    protected function getOrCreateCategory(string $name, ?Category $parent = null): Category
    {
        $key = $this->normalizeKey($name);
        
        // Check if already exists in map
        if (isset($this->categoryMap[$key]) && !empty($this->categoryMap[$key])) {
            $matchingCategories = $this->categoryMap[$key];
            
            // If parent is specified, try to find exact match (same name and parent)
            if ($parent) {
                foreach ($matchingCategories as $category) {
                    if ($category->parent_id === $parent->id) {
                        return $category; // Exact match found
                    }
                }
                
                // Check if any of the matching categories is a parent category (no parent_id)
                // If so, and we're trying to create a subcategory with the same name,
                // we should use the existing parent category instead
                foreach ($matchingCategories as $category) {
                    if ($category->parent_id === null) {
                        // Category exists as a parent, don't create duplicate as subcategory
                        // Use the parent category itself
                        return $category;
                    }
                }
                
                // No exact match found, create new subcategory
                return $this->createCategory($name, $parent);
            } else {
                // No parent specified - looking for a parent category
                // Find one without a parent_id
                foreach ($matchingCategories as $category) {
                    if ($category->parent_id === null) {
                        return $category; // Found parent category
                    }
                }
                
                // If all matches are subcategories, use the first one
                // (or we could create a parent, but this handles edge cases)
                return $matchingCategories[0];
            }
        }

        // Create new category
        return $this->createCategory($name, $parent);
    }

    protected function createCategory(string $name, ?Category $parent = null): Category
    {
        if ($this->dryRun) {
            $this->warn("  [DRY RUN] Would create category: {$name}" . ($parent ? " (under {$parent->name})" : ''));
            
            // Create a mock category for dry run
            $category = new Category([
                'user_id' => $this->user->id,
                'name' => $name,
                'parent_id' => $parent?->id,
                'color' => $this->generateColor(),
                'order' => 99,
            ]);
            $category->id = 'mock-' . uniqid();
            
            // Add to category map (as array for dry run too)
            $key = $this->normalizeKey($name);
            if (!isset($this->categoryMap[$key])) {
                $this->categoryMap[$key] = [];
            }
            $this->categoryMap[$key][] = $category;
            
            $this->createdCategories[] = $name . ($parent ? " (under {$parent->name})" : '');
            
            return $category;
        }

        $category = Category::create([
            'user_id' => $this->user->id,
            'name' => $name,
            'parent_id' => $parent?->id,
            'color' => $this->generateColor(),
            'order' => Category::where('user_id', $this->user->id)
                ->where('parent_id', $parent?->id)
                ->max('order') + 1,
        ]);

        // Add to category map (as array)
        $key = $this->normalizeKey($name);
        if (!isset($this->categoryMap[$key])) {
            $this->categoryMap[$key] = [];
        }
        $this->categoryMap[$key][] = $category;
        
        $this->createdCategories[] = $name . ($parent ? " (under {$parent->name})" : '');
        $this->info("  ✓ Created category: {$name}" . ($parent ? " (under {$parent->name})" : ''));

        return $category;
    }

    protected function getOrCreateIncomeSource(string $name): IncomeSource
    {
        $key = $this->normalizeKey($name);
        
        if (isset($this->incomeSourceMap[$key])) {
            return $this->incomeSourceMap[$key];
        }

        return $this->createIncomeSource($name);
    }

    protected function createIncomeSource(string $name): IncomeSource
    {
        if ($this->dryRun) {
            $this->warn("  [DRY RUN] Would create income source: {$name}");
            
            $source = new IncomeSource([
                'user_id' => $this->user->id,
                'name' => $name,
                'color' => $this->generateColor(),
                'order' => 99,
            ]);
            $source->id = 'mock-' . uniqid();
            
            $this->incomeSourceMap[$this->normalizeKey($name)] = $source;
            $this->createdIncomeSources[] = $name;
            
            return $source;
        }

        $source = IncomeSource::create([
            'user_id' => $this->user->id,
            'name' => $name,
            'color' => $this->generateColor(),
            'order' => IncomeSource::where('user_id', $this->user->id)->max('order') + 1,
        ]);

        $this->incomeSourceMap[$this->normalizeKey($name)] = $source;
        $this->createdIncomeSources[] = $name;
        $this->info("  ✓ Created income source: {$name}");

        return $source;
    }

    protected function createTransaction(Category $category, float $amount, int $month, string $description): void
    {
        if ($this->dryRun) {
            $this->stats['expenses']['created']++;
            return;
        }

        try {
            // Check if transaction already exists to avoid duplicates
            $exists = Transaction::where('user_id', $this->user->id)
                ->where('category_id', $category->id)
                ->where('year', $this->year)
                ->where('month', $month)
                ->where('amount', $amount)
                ->exists();

            if ($exists) {
                $this->stats['expenses']['skipped']++;
                return;
            }

            Transaction::create([
                'user_id' => $this->user->id,
                'category_id' => $category->id,
                'amount' => $amount,
                'description' => $description,
                'month' => $month,
                'year' => $this->year,
                'date' => now()->setYear($this->year)->setMonth($month)->setDay(15),
            ]);

            $this->stats['expenses']['created']++;
        } catch (\Exception $e) {
            $this->stats['expenses']['errors']++;
            $this->error("  ✗ Error creating transaction: {$e->getMessage()}");
        }
    }

    protected function createIncomeEntry(IncomeSource $source, float $amount, int $month, string $description): void
    {
        if ($this->dryRun) {
            $this->stats['income']['created']++;
            return;
        }

        try {
            // Check if income entry already exists
            $exists = IncomeEntry::where('user_id', $this->user->id)
                ->where('income_source_id', $source->id)
                ->where('year', $this->year)
                ->where('month', $month)
                ->where('amount', $amount)
                ->exists();

            if ($exists) {
                $this->stats['income']['skipped']++;
                return;
            }

            IncomeEntry::create([
                'user_id' => $this->user->id,
                'income_source_id' => $source->id,
                'amount' => $amount,
                'description' => $description,
                'month' => $month,
                'year' => $this->year,
                'date' => now()->setYear($this->year)->setMonth($month)->setDay(15),
            ]);

            $this->stats['income']['created']++;
        } catch (\Exception $e) {
            $this->stats['income']['errors']++;
            $this->error("  ✗ Error creating income entry: {$e->getMessage()}");
        }
    }

    protected function isEmptyRow(array $row): bool
    {
        return empty(trim(implode('', $row)));
    }

    protected function isHeaderRow(array $row): bool
    {
        $rowStr = implode(',', $row);
        return str_contains($rowStr, 'Jan') && str_contains($rowStr, 'Feb') && str_contains($rowStr, 'Mar');
    }

    protected function parseAmount(string $amountStr): float
    {
        // Remove currency symbols, spaces, and commas
        $cleaned = preg_replace('/[$,"\s]/', '', $amountStr);
        return (float) $cleaned;
    }

    protected function normalizeKey(string $name): string
    {
        return Str::lower(Str::slug($name));
    }

    protected function generateColor(): string
    {
        $colors = [
            '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95',
            '#A78BFA', '#9333EA', '#A855F7', '#C084FC', '#D8B4FE',
            '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A',
            '#10B981', '#059669', '#047857', '#065F46', '#064E3B',
            '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D',
            '#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F',
        ];

        return $colors[array_rand($colors)];
    }

    protected function displaySummary(): void
    {
        $this->newLine();
        $this->info('═══════════════════════════════════════════════════');
        $this->info('                 IMPORT SUMMARY                    ');
        $this->info('═══════════════════════════════════════════════════');
        
        if (!empty($this->createdCategories)) {
            $this->newLine();
            $this->info('📁 Categories Created (' . count($this->createdCategories) . '):');
            foreach ($this->createdCategories as $cat) {
                $this->line("   • {$cat}");
            }
        }

        if (!empty($this->createdIncomeSources)) {
            $this->newLine();
            $this->info('💵 Income Sources Created (' . count($this->createdIncomeSources) . '):');
            foreach ($this->createdIncomeSources as $source) {
                $this->line("   • {$source}");
            }
        }

        $this->newLine();
        $this->info('💸 Expenses:');
        $this->line("   ✓ Created: {$this->stats['expenses']['created']}");
        if ($this->stats['expenses']['skipped'] > 0) {
            $this->line("   ⊘ Skipped (duplicates): {$this->stats['expenses']['skipped']}");
        }
        if ($this->stats['expenses']['errors'] > 0) {
            $this->error("   ✗ Errors: {$this->stats['expenses']['errors']}");
        }

        $this->newLine();
        $this->info('💰 Income:');
        $this->line("   ✓ Created: {$this->stats['income']['created']}");
        if ($this->stats['income']['skipped'] > 0) {
            $this->line("   ⊘ Skipped (duplicates): {$this->stats['income']['skipped']}");
        }
        if ($this->stats['income']['errors'] > 0) {
            $this->error("   ✗ Errors: {$this->stats['income']['errors']}");
        }

        $this->newLine();
        $this->info('═══════════════════════════════════════════════════');
        
        if ($this->dryRun) {
            $this->newLine();
            $this->warn('This was a DRY RUN - no data was saved to the database.');
            $this->info('Run without --dry-run to actually import the data.');
        } else {
            $this->newLine();
            $this->info('✅ Import completed successfully!');
        }
    }
}

