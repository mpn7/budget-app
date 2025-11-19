import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency } from '@/utils/currency';
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function Create({
    incomeSources,
    year,
    month,
    existingIncomeEntries,
    totalIncome,
}) {
    const [selectedYear, setSelectedYear] = useState(year);
    const [selectedMonth, setSelectedMonth] = useState(month);
    const [cellData, setCellData] = useState({});
    const [focusedCell, setFocusedCell] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const inputRefs = useRef({});

    // Initialize cell data from existing income entries
    useEffect(() => {
        const initialData = {};
        if (incomeSources && existingIncomeEntries) {
            const entriesMap =
                existingIncomeEntries instanceof Map
                    ? existingIncomeEntries
                    : new Map(Object.entries(existingIncomeEntries || {}));

            incomeSources.forEach((source) => {
                const key = `${source.id}`;
                const existing = entriesMap.get(source.id.toString());
                if (existing && existing.length > 0) {
                    // Sum up existing income entries for this source
                    const total = existing.reduce(
                        (sum, e) => sum + parseFloat(e.amount),
                        0,
                    );
                    initialData[key] = total.toFixed(2);
                }
            });
        }
        setCellData(initialData);
    }, [incomeSources, existingIncomeEntries]);

    // Automatically load data when month/year changes
    useEffect(() => {
        // Only load if month/year is different from initial props
        if (selectedYear !== year || selectedMonth !== month) {
            router.get(
                route('income-entries.create'),
                { year: selectedYear, month: selectedMonth },
                { preserveState: false },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedMonth]);

    const handleCellChange = (sourceId, value) => {
        const key = `${sourceId}`;
        // Allow numbers, decimal points, and + signs for calculations
        const cleaned = value.replace(/[^0-9.+]/g, '');
        setCellData((prev) => ({
            ...prev,
            [key]: cleaned,
        }));
    };

    const handleCellBlur = (sourceId) => {
        const key = `${sourceId}`;
        const value = cellData[key];
        let updatedData = { ...cellData };

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
                    updatedData[key] = sum.toFixed(2);
                } else {
                    // If calculation failed, clear the field
                    updatedData[key] = '';
                }
            } else {
                // Single value - format to 2 decimal places
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue > 0) {
                    updatedData[key] = numValue.toFixed(2);
                } else {
                    // Clear invalid values
                    updatedData[key] = '';
                }
            }
        } else {
            // Field is empty, remove it from data
            delete updatedData[key];
        }

        // Update state
        setCellData(updatedData);

        // Save only this income source immediately
        saveIncome(sourceId, updatedData[key] || '');
    };

    const handleKeyDown = (e, sourceId, nextSourceId) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (nextSourceId) {
                const nextKey = `${nextSourceId}`;
                const nextInput = inputRefs.current[nextKey];
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            }
        }
    };

    const saveIncome = (sourceId, amount) => {
        const numAmount = parseFloat(amount);
        const amountToSave = !isNaN(numAmount) && numAmount > 0 ? numAmount : null;

        setIsProcessing(true);

        router.post(
            route('income-entries.single'),
            {
                income_source_id: parseInt(sourceId),
                amount: amountToSave,
                month: selectedMonth,
                year: selectedYear,
            },
            {
                preserveScroll: true,
                preserveState: true,
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
                        Add Income
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
            <Head title="Add Income" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Total Income Display */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Total Income for{' '}
                                        {getMonthName(selectedMonth)}{' '}
                                        {selectedYear}
                                    </div>
                                    <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(
                                            calculateTotal() ||
                                            totalIncome ||
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
                                            Income Source
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {incomeSources &&
                                        incomeSources.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="2"
                                                className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                No income sources found. Please
                                                create income sources first.
                                            </td>
                                        </tr>
                                    ) : (
                                        incomeSources.map((source, index) => {
                                            const cellKey = `${source.id}`;
                                            const value =
                                                cellData[cellKey] || '';
                                            const nextSource =
                                                incomeSources[index + 1];
                                            const isFocused =
                                                focusedCell === cellKey;

                                            return (
                                                <tr
                                                    key={source.id}
                                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isFocused
                                                        ? 'bg-primary-50 dark:bg-primary-900/20'
                                                        : ''
                                                        }`}
                                                >
                                                    <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-6 py-4 text-sm font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="h-4 w-4 rounded"
                                                                style={{
                                                                    backgroundColor:
                                                                        source.color ||
                                                                        '#8B5CF6',
                                                                }}
                                                            />
                                                            <span>{source.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-2">
                                                        <div className="relative">
                                                            <input
                                                                ref={(el) => {
                                                                    if (el) {
                                                                        inputRefs.current[
                                                                            cellKey
                                                                        ] = el;
                                                                    }
                                                                }}
                                                                type="text"
                                                                value={value}
                                                                onChange={(e) =>
                                                                    handleCellChange(
                                                                        source.id,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                onBlur={() => {
                                                                    handleCellBlur(
                                                                        source.id,
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
                                                                onKeyDown={(e) =>
                                                                    handleKeyDown(
                                                                        e,
                                                                        source.id,
                                                                        nextSource?.id,
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
                                        })
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
