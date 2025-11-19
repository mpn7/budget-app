import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency } from '@/utils/currency';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Dashboard({
    year,
    month,
    summary,
    trends,
    monthlyData,
    categoryBreakdown,
    startingBalance,
    initialInvestment,
    expensesPerCategoryPerMonth,
}) {
    const [selectedYear, setSelectedYear] = useState(year);
    const [selectedMonth, setSelectedMonth] = useState(month);

    const handleYearChange = (newYear) => {
        setSelectedYear(newYear);
        router.get(
            route('dashboard'),
            { year: newYear, month: selectedMonth },
            { preserveState: true },
        );
    };

    const handleMonthChange = (newMonth) => {
        setSelectedMonth(newMonth);
        router.get(
            route('dashboard'),
            { year: selectedYear, month: newMonth },
            { preserveState: true },
        );
    };

    // Trend indicator component
    const TrendIndicator = ({ value, label }) => {
        if (!value || value === 0) return null;

        const isPositive = value > 0;
        // Determine if the trend is good based on the metric
        // expenses: lower is better (decrease is good)
        // income, investments, networth: higher is better (increase is good)
        const isGood = (label === 'expenses') ? !isPositive : isPositive;

        return (
            <div className={`mt-1 flex items-center text-xs ${isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                {isPositive ? (
                    <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                )}
                <span className="font-medium">{Math.abs(value).toFixed(1)}%</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                        Budget Dashboard
                    </h2>
                    <div className="flex gap-2">
                        <select
                            value={selectedYear}
                            onChange={(e) => handleYearChange(e.target.value)}
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
                            value={selectedMonth || ''}
                            onChange={(e) =>
                                handleMonthChange(
                                    e.target.value
                                        ? parseInt(e.target.value)
                                        : null,
                                )
                            }
                            className="rounded-md border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            <option value="">All Months</option>
                            {Array.from({ length: 12 }, (_, i) => {
                                const monthNum = i + 1;
                                const date = new Date(2000, monthNum - 1, 1);
                                return (
                                    <option key={monthNum} value={monthNum}>
                                        {date.toLocaleString('default', {
                                            month: 'long',
                                        })}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6">
                <div className="mx-auto max-w-[1560px] sm:px-6 lg:px-8">
                    {/* Summary Cards */}
                    <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="p-6">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Current Balance
                                </div>
                                <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(
                                        summary.currentBalance ||
                                        startingBalance ||
                                        0,
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="p-6">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Total Investments
                                </div>
                                <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {formatCurrency(
                                        summary.totalInvestments || 0,
                                    )}
                                </div>
                                {trends && <TrendIndicator value={trends.investmentsChange} label="investments" />}
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="p-6">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Net Worth
                                </div>
                                <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {formatCurrency(summary.netWorth || 0)}
                                </div>
                                {trends && <TrendIndicator value={trends.netWorthChange} label="networth" />}
                            </div>
                        </div>
                    </div>
                    <div className="mb-6 grid gap-6 md:grid-cols-2">
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="p-6">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Total Expenses
                                </div>
                                <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(summary.totalExpenses)}
                                </div>
                                {trends && <TrendIndicator value={trends.expensesMoMChange} label="expenses" />}
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="p-6">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Net
                                </div>
                                <div
                                    className={`mt-2 text-3xl font-bold ${summary.net >= 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                        }`}
                                >
                                    {formatCurrency(summary.net || 0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Chart */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Monthly Overview
                            </h3>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {monthlyData.map((data) => {
                                    const maxValue = Math.max(
                                        ...monthlyData.map((d) =>
                                            Math.max(d.income, d.expenses),
                                        ),
                                    );
                                    const incomePercent =
                                        (data.income / maxValue) * 100;
                                    const expensePercent =
                                        (data.expenses / maxValue) * 100;

                                    return (
                                        <div
                                            key={data.month}
                                            className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                                        >
                                            <div className="w-24 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {data.monthName}
                                            </div>
                                            <div className="flex-1">
                                                <div className="mb-2 flex gap-1">
                                                    <div
                                                        className="h-6 rounded-l bg-green-500"
                                                        style={{
                                                            width: `${incomePercent}%`,
                                                        }}
                                                        title={`Income: ${formatCurrency(data.income)}`}
                                                    />
                                                    <div
                                                        className="h-6 rounded-r bg-red-500"
                                                        style={{
                                                            width: `${expensePercent}%`,
                                                        }}
                                                        title={`Expenses: ${formatCurrency(data.expenses)}`}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                                    <span>
                                                        Income:{' '}
                                                        {formatCurrency(
                                                            data.income,
                                                        )}
                                                    </span>
                                                    <span>
                                                        Expenses:{' '}
                                                        {formatCurrency(
                                                            data.expenses,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex justify-between text-xs">
                                                    <span
                                                        className={
                                                            data.netSavings >= 0
                                                                ? 'font-semibold text-green-600 dark:text-green-400'
                                                                : 'font-semibold text-red-600 dark:text-red-400'
                                                        }
                                                    >
                                                        Net Savings:{' '}
                                                        {formatCurrency(
                                                            data.netSavings,
                                                        )}
                                                    </span>
                                                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                        Balance:{' '}
                                                        {formatCurrency(
                                                            data.balance,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Expenses by Category */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Expenses by Category
                            </h3>
                            <div className="space-y-4">
                                {categoryBreakdown.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        No expenses yet
                                    </p>
                                ) : (
                                    categoryBreakdown.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-4 w-4 rounded"
                                                    style={{
                                                        backgroundColor:
                                                            cat.color,
                                                    }}
                                                />
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {cat.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Total
                                                    </div>
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(
                                                            cat.amount,
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Average
                                                    </div>
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(
                                                            cat.average,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Expenses per Category per Month Table */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Expenses per Category per Month
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                                Category
                                            </th>
                                            {monthlyData.map((month) => (
                                                <th
                                                    key={month.month}
                                                    className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                                >
                                                    {month.monthName.substring(
                                                        0,
                                                        3,
                                                    )}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                        {expensesPerCategoryPerMonth &&
                                            expensesPerCategoryPerMonth.length >
                                            0 ? (
                                            <>
                                                {expensesPerCategoryPerMonth.map(
                                                    (category) => (
                                                        <tr
                                                            key={category.id}
                                                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        >
                                                            <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 text-sm font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="h-4 w-4 rounded"
                                                                        style={{
                                                                            backgroundColor:
                                                                                category.color,
                                                                        }}
                                                                    />
                                                                    <span>
                                                                        {
                                                                            category.name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            {category.monthlyExpenses.map(
                                                                (
                                                                    amount,
                                                                    index,
                                                                ) => (
                                                                    <td
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100"
                                                                    >
                                                                        {amount >
                                                                            0
                                                                            ? formatCurrency(
                                                                                amount,
                                                                            )
                                                                            : '-'}
                                                                    </td>
                                                                ),
                                                            )}
                                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                {formatCurrency(
                                                                    category.total,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold dark:border-gray-600 dark:bg-gray-700">
                                                    <td className="sticky left-0 z-10 whitespace-nowrap bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                                                        Total
                                                    </td>
                                                    {monthlyData.map(
                                                        (month, index) => {
                                                            const monthTotal =
                                                                expensesPerCategoryPerMonth.reduce(
                                                                    (
                                                                        sum,
                                                                        cat,
                                                                    ) =>
                                                                        sum +
                                                                        cat
                                                                            .monthlyExpenses[
                                                                        index
                                                                        ],
                                                                    0,
                                                                );
                                                            return (
                                                                <td
                                                                    key={
                                                                        month.month
                                                                    }
                                                                    className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-gray-100"
                                                                >
                                                                    {formatCurrency(
                                                                        monthTotal,
                                                                    )}
                                                                </td>
                                                            );
                                                        },
                                                    )}
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(
                                                            expensesPerCategoryPerMonth.reduce(
                                                                (sum, cat) =>
                                                                    sum +
                                                                    cat.total,
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                </tr>
                                            </>
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={14}
                                                    className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                                >
                                                    No expenses yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </AuthenticatedLayout>
    );
}
