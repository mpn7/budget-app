import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency } from '@/utils/currency';
import { Head, router } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';

export default function Create({
    categories,
    year,
    month,
    months,
    transactionsByMonth,
}) {
    const [selectedYear, setSelectedYear] = useState(year);
    const [selectedMonth, setSelectedMonth] = useState(month);
    const [cellData, setCellData] = useState({});
    const [rawValues, setRawValues] = useState({});
    const [focusedCell, setFocusedCell] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const inputRefs = useRef({});
    const saveTimeoutRef = useRef(null);

    // Initialize cell data from existing transactions for all months
    useEffect(() => {
        const initialData = {};
        const initialRawValues = {};
        if (categories && transactionsByMonth && months) {
            months.forEach((monthData) => {
                const monthKey = `${monthData.year}-${monthData.month}`;
                const monthTransactions = transactionsByMonth[monthKey] || {};

                // Convert to Map if needed
                const transactionsMap =
                    monthTransactions instanceof Map
                        ? monthTransactions
                        : new Map(Object.entries(monthTransactions || {}));

                categories.forEach((category) => {
                    if (category.children && category.children.length > 0) {
                        category.children.forEach((subcategory) => {
                            const key = `${subcategory.id}-${monthKey}`;
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

                                // Load raw_value if it exists (only from first transaction since we only store one per category/month)
                                if (existing[0].raw_value) {
                                    initialRawValues[key] = existing[0].raw_value;
                                }
                            }
                        });
                    }
                });
            });
        }
        setCellData(initialData);
        setRawValues(initialRawValues);
    }, [categories, transactionsByMonth, months]);

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

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const handleCellFocus = (categoryId, monthKey) => {
        const key = `${categoryId}-${monthKey}`;
        setFocusedCell(key);

        // If there's a raw value stored, show it in the input
        const rawValue = rawValues[key];
        if (rawValue) {
            setCellData((prev) => ({
                ...prev,
                [key]: rawValue,
            }));
        }
    };

    const handleCellChange = (categoryId, monthKey, value) => {
        const key = `${categoryId}-${monthKey}`;
        // Allow numbers, decimal points, and math operators (+, -, *, /)
        const cleaned = value.replace(/[^0-9.+\-*/]/g, '');
        setCellData((prev) => ({
            ...prev,
            [key]: cleaned,
        }));
    };

    const handleCellBlur = (categoryId, monthKey) => {
        const key = `${categoryId}-${monthKey}`;
        const value = cellData[key];
        let updatedData = { ...cellData };
        let updatedRawValues = { ...rawValues };
        let rawValue = null;

        if (value) {
            // Store the original value before evaluation
            rawValue = value;

            // Check if the value contains any math operators
            if (value.match(/[+\-*/]/)) {
                try {
                    // Evaluate the mathematical expression
                    // Using Function constructor for safe evaluation of simple math
                    const result = Function('"use strict"; return (' + value + ')')();
                    if (!isNaN(result) && result > 0) {
                        updatedData[key] = result.toFixed(2);
                        updatedRawValues[key] = rawValue; // Store the original expression
                    } else {
                        // If calculation resulted in 0 or negative, clear the field
                        updatedData[key] = '';
                        delete updatedRawValues[key];
                    }
                } catch (e) {
                    // If evaluation failed, try legacy + operator approach
                    if (value.includes('+')) {
                        const parts = value.split('+').map((part) => {
                            const cleaned = part.trim().replace(/[^0-9.]/g, '');
                            return parseFloat(cleaned) || 0;
                        });
                        const sum = parts.reduce((total, num) => total + num, 0);
                        if (!isNaN(sum) && sum > 0) {
                            updatedData[key] = sum.toFixed(2);
                            updatedRawValues[key] = rawValue; // Store the original expression
                        } else {
                            updatedData[key] = '';
                            delete updatedRawValues[key];
                        }
                    } else {
                        // Clear invalid expressions
                        updatedData[key] = '';
                        delete updatedRawValues[key];
                    }
                }
            } else {
                // Single value - format to 2 decimal places
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue > 0) {
                    updatedData[key] = numValue.toFixed(2);
                    // For single values, don't store raw_value (only for expressions)
                    delete updatedRawValues[key];
                } else {
                    // Clear invalid values
                    updatedData[key] = '';
                    delete updatedRawValues[key];
                }
            }
        } else {
            // Field is empty, remove it from data
            delete updatedData[key];
            delete updatedRawValues[key];
        }

        // Update state
        setCellData(updatedData);
        setRawValues(updatedRawValues);

        // Parse month/year from monthKey
        const [monthYear, monthMonth] = monthKey.split('-');

        // Clear any pending save timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce the save slightly to prevent rapid-fire saves
        saveTimeoutRef.current = setTimeout(() => {
            saveExpense(categoryId, updatedData[key] || '', updatedRawValues[key] || null, parseInt(monthYear), parseInt(monthMonth));
        }, 100);
    };

    const handleKeyDown = (e, categoryId, monthKey, nextCategoryId) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (nextCategoryId) {
                const nextKey = `${nextCategoryId}-${monthKey}`;
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

    const saveExpense = (categoryId, amount, rawValue, saveYear, saveMonth) => {
        const numAmount = parseFloat(amount);
        const amountToSave = !isNaN(numAmount) && numAmount > 0 ? numAmount : null;

        setIsProcessing(true);

        // Use fetch instead of router.post to avoid any page refresh/state updates
        fetch(route('transactions.single'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                category_id: parseInt(categoryId),
                amount: amountToSave,
                raw_value: rawValue,
                month: saveMonth,
                year: saveYear,
            }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Save failed');
                }
                setLastSaved(new Date());
                setIsProcessing(false);
            })
            .catch((error) => {
                console.error('Save error:', error);
                setIsProcessing(false);
            });
    };


    const calculateTotal = (monthKey) => {
        return Object.entries(cellData)
            .filter(([key]) => key.endsWith(`-${monthKey}`))
            .reduce((sum, [, val]) => {
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
                    {/* Total Expenses Display for All Months */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                                {months && months.map((monthData) => {
                                    const monthKey = `${monthData.year}-${monthData.month}`;
                                    const total = calculateTotal(monthKey);
                                    const isCurrent = monthData.year === year && monthData.month === month;
                                    return (
                                        <div onClick={() => {
                                            if (!isCurrent) {
                                                setSelectedYear(monthData.year);
                                                setSelectedMonth(monthData.month);
                                            }
                                        }} key={monthKey} className={isCurrent ? 'rounded-lg border-2 border-primary-500 p-2' : ''}>
                                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {monthData.monthName} {monthData.yearName}
                                                {isCurrent && <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">(Current)</span>}
                                            </div>
                                            <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                                                {formatCurrency(total)}
                                            </div>
                                        </div>
                                    );
                                })}
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
                                        {months && months.map((monthData) => {
                                            const monthKey = `${monthData.year}-${monthData.month}`;
                                            const isCurrent = monthData.year === year && monthData.month === month;
                                            return (
                                                <th key={monthKey} className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${isCurrent ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-500 dark:text-gray-300'}`}>
                                                    {monthData.monthName.substring(0, 3)} {monthData.yearName}
                                                    {isCurrent && <div className="text-[10px] font-normal normal-case">Current</div>}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {groupedCategories.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={months ? months.length + 1 : 2}
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
                                                            className="sticky left-0 z-10 bg-primary-50 px-6 py-3 text-sm font-bold text-gray-900 dark:bg-primary-900/20 dark:text-gray-100"
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
                                                        {months && months.map((monthData) => {
                                                            const monthKey = `${monthData.year}-${monthData.month}`;
                                                            const subtotal = group.children.reduce(
                                                                (sum, child) => {
                                                                    const val = cellData[`${child.id}-${monthKey}`];
                                                                    const num = parseFloat(val);
                                                                    return sum + (isNaN(num) ? 0 : num);
                                                                },
                                                                0
                                                            );
                                                            const isCurrent = monthData.year === year && monthData.month === month;
                                                            return (
                                                                <td key={monthKey} className={`px-4 py-3 text-right text-sm font-semibold ${isCurrent ? 'bg-primary-100 dark:bg-primary-900/40' : ''} text-gray-500 dark:text-gray-400`}>
                                                                    {subtotal > 0 ? formatCurrency(subtotal) : '—'}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                    {/* Subcategories */}
                                                    {group.children.map(
                                                        (category) => {
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

                                                            return (
                                                                <tr
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
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
                                                                    {months && months.map((monthData) => {
                                                                        const monthKey = `${monthData.year}-${monthData.month}`;
                                                                        const cellKey = `${category.id}-${monthKey}`;
                                                                        const value = cellData[cellKey] || '';
                                                                        const isFocused = focusedCell === cellKey;
                                                                        const isCurrent = monthData.year === year && monthData.month === month;

                                                                        const rawValue = rawValues[cellKey];
                                                                        const hasExpression = rawValue && rawValue !== value;

                                                                        return (
                                                                            <td key={monthKey} className={`px-2 py-2 ${isCurrent ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                                                                                <div className="relative">
                                                                                    <input
                                                                                        ref={(el) => {
                                                                                            if (el) {
                                                                                                inputRefs.current[cellKey] = el;
                                                                                            }
                                                                                        }}
                                                                                        type="text"
                                                                                        value={value}
                                                                                        onChange={(e) =>
                                                                                            handleCellChange(
                                                                                                category.id,
                                                                                                monthKey,
                                                                                                e.target.value,
                                                                                            )
                                                                                        }
                                                                                        onBlur={() => {
                                                                                            handleCellBlur(
                                                                                                category.id,
                                                                                                monthKey,
                                                                                            );
                                                                                            setFocusedCell(null);
                                                                                        }}
                                                                                        onFocus={() =>
                                                                                            handleCellFocus(
                                                                                                category.id,
                                                                                                monthKey,
                                                                                            )
                                                                                        }
                                                                                        onKeyDown={(e) =>
                                                                                            handleKeyDown(
                                                                                                e,
                                                                                                category.id,
                                                                                                monthKey,
                                                                                                nextCategory?.id,
                                                                                            )
                                                                                        }
                                                                                        placeholder="-"
                                                                                        className={`w-full rounded-md border-gray-300 bg-white px-2 py-1.5 text-right text-sm font-medium text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${isFocused ? 'ring-2 ring-primary-500' : ''}`}
                                                                                        title={hasExpression ? `Original: ${rawValue}` : ''}
                                                                                    />
                                                                                    {hasExpression && !isFocused && (
                                                                                        <div className="mt-0.5 text-right text-[10px] text-gray-500 dark:text-gray-400">
                                                                                            ({rawValue})
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        );
                                                                    })}
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
                                            {months && months.map((monthData) => {
                                                const monthKey = `${monthData.year}-${monthData.month}`;
                                                const total = calculateTotal(monthKey);
                                                const isCurrent = monthData.year === year && monthData.month === month;
                                                return (
                                                    <td key={monthKey} className={`px-4 py-4 text-right text-sm font-bold ${isCurrent ? 'bg-primary-100 dark:bg-primary-900/40' : ''} text-gray-900 dark:text-gray-100`}>
                                                        {formatCurrency(total)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Enter amounts or use math: <span className="font-mono text-xs">100+50</span>, <span className="font-mono text-xs">500-50</span>, <span className="font-mono text-xs">4*250</span>.
                                    Press Tab/Enter to move to next row. Edit any of the 4 months shown.
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
