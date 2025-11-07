import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';

export default function Create({
    categories,
    year,
    month,
    existingTransactions,
    totalExpenses,
}) {
    const [selectedYear, setSelectedYear] = useState(year);
    const [selectedMonth, setSelectedMonth] = useState(month);
    const [cellData, setCellData] = useState({});
    const [focusedCell, setFocusedCell] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const inputRefs = useRef({});
    const saveTimeoutRef = useRef(null);

    // Initialize cell data from existing transactions
    useEffect(() => {
        const initialData = {};
        if (categories && existingTransactions) {
            // Convert existingTransactions to a Map-like object if it's not already
            const transactionsMap =
                existingTransactions instanceof Map
                    ? existingTransactions
                    : new Map(Object.entries(existingTransactions || {}));

            categories.forEach((category) => {
                if (category.children && category.children.length > 0) {
                    category.children.forEach((subcategory) => {
                        const key = `${subcategory.id}`;
                        const existing = transactionsMap.get(
                            subcategory.id.toString(),
                        );
                        if (existing && existing.length > 0) {
                            // Sum up existing transactions for this category
                            const total = existing.reduce(
                                (sum, t) => sum + parseFloat(t.amount),
                                0,
                            );
                            initialData[key] = total.toFixed(2);
                        }
                    });
                }
            });
        }
        setCellData(initialData);
    }, [categories, existingTransactions]);

    // Automatically load data when month/year changes
    useEffect(() => {
        // Only load if month/year is different from initial props
        if (selectedYear !== year || selectedMonth !== month) {
            router.get(
                route('transactions.create'),
                { year: selectedYear, month: selectedMonth },
                { preserveState: false },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedMonth]);

    const handleCellChange = (categoryId, value) => {
        const key = `${categoryId}`;
        // Allow numbers, decimal points, and + signs for calculations
        const cleaned = value.replace(/[^0-9.+]/g, '');
        setCellData((prev) => ({
            ...prev,
            [key]: cleaned,
        }));
    };

    const handleCellBlur = (categoryId) => {
        const key = `${categoryId}`;
        const value = cellData[key];
        if (value) {
            // Check if the value contains a + sign (multiple values to sum)
            if (value.includes('+')) {
                // Split by + and sum all values
                const parts = value.split('+').map((part) => {
                    // Remove any whitespace and parse
                    const cleaned = part.trim().replace(/[^0-9.]/g, '');
                    return parseFloat(cleaned) || 0;
                });
                const sum = parts.reduce((total, num) => total + num, 0);
                if (!isNaN(sum) && sum > 0) {
                    setCellData((prev) => ({
                        ...prev,
                        [key]: sum.toFixed(2),
                    }));
                    // Trigger auto-save after calculation
                    triggerAutoSave();
                } else {
                    // If calculation failed, clear the field
                    setCellData((prev) => ({
                        ...prev,
                        [key]: '',
                    }));
                    // Trigger auto-save after clearing
                    triggerAutoSave();
                }
            } else {
                // Single value - format to 2 decimal places
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue > 0) {
                    setCellData((prev) => ({
                        ...prev,
                        [key]: numValue.toFixed(2),
                    }));
                    // Trigger auto-save after formatting
                    triggerAutoSave();
                } else {
                    // Clear invalid values
                    setCellData((prev) => ({
                        ...prev,
                        [key]: '',
                    }));
                    // Trigger auto-save after clearing
                    triggerAutoSave();
                }
            }
        } else {
            // Field is empty, trigger auto-save to clear any existing data
            triggerAutoSave();
        }
    };

    const handleKeyDown = (e, categoryId, nextCategoryId) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (nextCategoryId) {
                const nextKey = `${nextCategoryId}`;
                const nextInput = inputRefs.current[nextKey];
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            }
        }
    };

    const getGroupedCategories = () => {
        const grouped = [];
        if (categories) {
            categories.forEach((cat) => {
                if (cat.children && cat.children.length > 0) {
                    grouped.push({
                        parent: cat,
                        children: cat.children,
                    });
                }
            });
        }
        return grouped;
    };

    const getFlatCategories = () => {
        const flat = [];
        if (categories) {
            categories.forEach((cat) => {
                if (cat.children && cat.children.length > 0) {
                    cat.children.forEach((sub) => {
                        flat.push({ ...sub, parentName: cat.name });
                    });
                }
            });
        }
        return flat;
    };

    const groupedCategories = getGroupedCategories();
    const flatCategories = getFlatCategories();

    const saveExpenses = () => {
        // Build transactions array from cell data
        const transactions = [];
        Object.entries(cellData).forEach(([categoryId, amount]) => {
            const numAmount = parseFloat(amount);
            if (!isNaN(numAmount) && numAmount > 0) {
                transactions.push({
                    category_id: parseInt(categoryId),
                    amount: numAmount,
                    description: null,
                });
            }
        });

        // Only save if there are transactions or if we're clearing data
        if (transactions.length === 0 && Object.keys(cellData).length === 0) {
            return; // Don't save empty data
        }

        setIsProcessing(true);

        router.post(
            route('transactions.bulk'),
            {
                transactions: transactions,
                month: selectedMonth,
                year: selectedYear,
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    console.error('Save errors:', errors);
                    setIsProcessing(false);
                },
                onSuccess: () => {
                    setLastSaved(new Date());
                    setIsProcessing(false);
                },
                onFinish: () => {
                    setIsProcessing(false);
                },
            },
        );
    };

    // Auto-save with debounce
    const triggerAutoSave = () => {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout to save after 1.5 seconds of inactivity
        saveTimeoutRef.current = setTimeout(() => {
            saveExpenses();
        }, 1500);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const formatCurrency = (amount) => {
        if (!amount || amount === '0' || amount === '0.00') return '';
        const num = parseFloat(amount);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const calculateTotal = () => {
        return Object.values(cellData).reduce((sum, val) => {
            const num = parseFloat(val);
            return sum + (isNaN(num) ? 0 : num);
        }, 0);
    };

    const getMonthName = (monthNum) => {
        const date = new Date(2000, monthNum - 1, 1);
        return date.toLocaleString('default', { month: 'long' });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                        Add Expenses
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedYear}
                                onChange={(e) =>
                                    setSelectedYear(parseInt(e.target.value))
                                }
                                className="rounded-md border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                                {Array.from({ length: 10 }, (_, i) => {
                                    const y = new Date().getFullYear() - 5 + i;
                                    return (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    );
                                })}
                            </select>
                            <select
                                value={selectedMonth}
                                onChange={(e) =>
                                    setSelectedMonth(parseInt(e.target.value))
                                }
                                className="rounded-md border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                                {Array.from({ length: 12 }, (_, i) => {
                                    const monthNum = i + 1;
                                    return (
                                        <option key={monthNum} value={monthNum}>
                                            {getMonthName(monthNum)}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Add Expenses" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Total Expenses Display */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Total Expenses for{' '}
                                        {getMonthName(selectedMonth)}{' '}
                                        {selectedYear}
                                    </div>
                                    <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                                        {formatCurrency(
                                            calculateTotal() ||
                                                totalExpenses ||
                                                0,
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {groupedCategories.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="2"
                                                className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                No categories found. Please
                                                create categories first.
                                            </td>
                                        </tr>
                                    ) : (
                                        groupedCategories.map((group) => {
                                            return (
                                                <React.Fragment
                                                    key={`group-${group.parent.id}`}
                                                >
                                                    {/* Parent Category Header */}
                                                    <tr className="bg-primary-50 dark:bg-primary-900/20">
                                                        <td
                                                            colSpan="2"
                                                            className="sticky left-0 z-10 px-6 py-3 text-sm font-bold text-gray-900 dark:text-gray-100"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="h-4 w-4 rounded"
                                                                    style={{
                                                                        backgroundColor:
                                                                            group
                                                                                .parent
                                                                                .color ||
                                                                            '#8B5CF6',
                                                                    }}
                                                                />
                                                                {
                                                                    group.parent
                                                                        .name
                                                                }
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {/* Subcategories */}
                                                    {group.children.map(
                                                        (category) => {
                                                            const cellKey = `${category.id}`;
                                                            const value =
                                                                cellData[
                                                                    cellKey
                                                                ] || '';
                                                            // Find next category in flat list
                                                            const currentIndex =
                                                                flatCategories.findIndex(
                                                                    (c) =>
                                                                        c.id ===
                                                                        category.id,
                                                                );
                                                            const nextCategory =
                                                                flatCategories[
                                                                    currentIndex +
                                                                        1
                                                                ];
                                                            const isFocused =
                                                                focusedCell ===
                                                                cellKey;

                                                            return (
                                                                <tr
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                                                        isFocused
                                                                            ? 'bg-primary-50 dark:bg-primary-900/20'
                                                                            : ''
                                                                    }`}
                                                                >
                                                                    <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-6 py-4 pl-12 text-sm font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                                                                        <div className="flex items-center gap-2">
                                                                            <div
                                                                                className="h-3 w-3 rounded"
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        category.color ||
                                                                                        '#8B5CF6',
                                                                                }}
                                                                            />
                                                                            <span>
                                                                                {
                                                                                    category.name
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-2">
                                                                        <div className="relative">
                                                                            <input
                                                                                ref={(
                                                                                    el,
                                                                                ) => {
                                                                                    if (
                                                                                        el
                                                                                    ) {
                                                                                        inputRefs.current[
                                                                                            cellKey
                                                                                        ] =
                                                                                            el;
                                                                                    }
                                                                                }}
                                                                                type="text"
                                                                                value={
                                                                                    value
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    handleCellChange(
                                                                                        category.id,
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                onBlur={() => {
                                                                                    handleCellBlur(
                                                                                        category.id,
                                                                                    );
                                                                                    setFocusedCell(
                                                                                        null,
                                                                                    );
                                                                                }}
                                                                                onFocus={() =>
                                                                                    setFocusedCell(
                                                                                        cellKey,
                                                                                    )
                                                                                }
                                                                                onKeyDown={(
                                                                                    e,
                                                                                ) =>
                                                                                    handleKeyDown(
                                                                                        e,
                                                                                        category.id,
                                                                                        nextCategory?.id,
                                                                                    )
                                                                                }
                                                                                placeholder="0.00 or 10+10+10"
                                                                                className="w-full rounded-md border-gray-300 bg-white px-3 py-2 pr-16 text-right text-sm font-medium text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                            />
                                                                            {value &&
                                                                                parseFloat(
                                                                                    value,
                                                                                ) >
                                                                                    0 && (
                                                                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                                                        {formatCurrency(
                                                                                            value,
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                    {flatCategories.length > 0 && (
                                        <tr className="bg-gray-50 font-bold dark:bg-gray-700">
                                            <td className="sticky left-0 z-10 whitespace-nowrap bg-gray-50 px-6 py-4 text-sm font-bold text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                                                Total
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(
                                                    calculateTotal().toFixed(2),
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Enter amounts directly in the cells. Press
                                    Tab or Enter to move to the next row.
                                    Changes are saved automatically.
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                    {isProcessing ? (
                                        <span className="text-primary-600 dark:text-primary-400">
                                            Saving...
                                        </span>
                                    ) : lastSaved ? (
                                        <span className="text-green-600 dark:text-green-400">
                                            Saved{' '}
                                            {lastSaved.toLocaleTimeString()}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 dark:text-gray-500">
                                            Ready
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
