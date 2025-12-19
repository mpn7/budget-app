import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency } from '@/utils/currency';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function YearComparison({
    year1,
    year2,
    year1Data,
    year2Data,
    categoryComparison,
    incomeSourceComparison,
}) {
    const [selectedYear1, setSelectedYear1] = useState(year1);
    const [selectedYear2, setSelectedYear2] = useState(year2);

    const handleYearChange = (yearType, newYear) => {
        if (yearType === 'year1') {
            setSelectedYear1(newYear);
            router.get(
                route('year-comparison'),
                { year1: newYear, year2: selectedYear2 },
                { preserveState: true },
            );
        } else {
            setSelectedYear2(newYear);
            router.get(
                route('year-comparison'),
                { year1: selectedYear1, year2: newYear },
                { preserveState: true },
            );
        }
    };

    const calculateDifference = (val1, val2) => {
        return val2 - val1;
    };

    const calculatePercentChange = (val1, val2) => {
        if (val1 === 0) return val2 > 0 ? 100 : 0;
        return ((val2 - val1) / val1) * 100;
    };

    const DifferenceCell = ({ val1, val2, isExpense = false }) => {
        const diff = calculateDifference(val1, val2);
        const percentChange = calculatePercentChange(val1, val2);
        
        // For expenses: negative is good (spending less)
        // For income: positive is good (earning more)
        const isGood = isExpense ? diff < 0 : diff > 0;
        
        if (diff === 0) {
            return <span className="text-gray-500 dark:text-gray-400">—</span>;
        }

        return (
            <div className="text-right">
                <div className={`font-semibold ${
                    isGood 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                }`}>
                    {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                </div>
                <div className={`text-xs ${
                    isGood 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                }`}>
                    {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                        Year Comparison
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Compare:</span>
                            <select
                                value={selectedYear1}
                                onChange={(e) => handleYearChange('year1', parseInt(e.target.value))}
                                className="rounded-md border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                                {Array.from({ length: 10 }, (_, i) => {
                                    const y = new Date().getFullYear() - 9 + i;
                                    return (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    );
                                })}
                            </select>
                            <span className="text-sm text-gray-600 dark:text-gray-400">vs</span>
                            <select
                                value={selectedYear2}
                                onChange={(e) => handleYearChange('year2', parseInt(e.target.value))}
                                className="rounded-md border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                                {Array.from({ length: 10 }, (_, i) => {
                                    const y = new Date().getFullYear() - 9 + i;
                                    return (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Year Comparison" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Summary Comparison */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Annual Summary
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                Metric
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                {year1}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                {year2}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                Difference
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                        <tr>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                Total Income
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                {formatCurrency(year1Data.totalIncome)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                {formatCurrency(year2Data.totalIncome)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <DifferenceCell 
                                                    val1={year1Data.totalIncome} 
                                                    val2={year2Data.totalIncome}
                                                    isExpense={false}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                Total Expenses
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                {formatCurrency(year1Data.totalExpenses)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                {formatCurrency(year2Data.totalExpenses)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <DifferenceCell 
                                                    val1={year1Data.totalExpenses} 
                                                    val2={year2Data.totalExpenses}
                                                    isExpense={true}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                Total Investments
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                {formatCurrency(year1Data.totalInvestments)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                {formatCurrency(year2Data.totalInvestments)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <DifferenceCell 
                                                    val1={year1Data.totalInvestments} 
                                                    val2={year2Data.totalInvestments}
                                                    isExpense={false}
                                                />
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50 font-semibold dark:bg-gray-700">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                                                Net Savings
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                {formatCurrency(year1Data.netSavings)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                {formatCurrency(year2Data.netSavings)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <DifferenceCell 
                                                    val1={year1Data.netSavings} 
                                                    val2={year2Data.netSavings}
                                                    isExpense={false}
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Category Comparison */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Expenses by Category
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                {year1}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                {year2}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                Difference
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                        {categoryComparison.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No category data available for comparison
                                                </td>
                                            </tr>
                                        ) : (
                                            categoryComparison.map((category) => (
                                                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="h-3 w-3 rounded"
                                                                style={{
                                                                    backgroundColor: category.color || '#8B5CF6',
                                                                }}
                                                            />
                                                            {category.name}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(category.year1Amount)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(category.year2Amount)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <DifferenceCell 
                                                            val1={category.year1Amount} 
                                                            val2={category.year2Amount}
                                                            isExpense={true}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Income Source Comparison */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Income by Source
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                Source
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                {year1}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                {year2}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                Difference
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                        {incomeSourceComparison.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No income source data available for comparison
                                                </td>
                                            </tr>
                                        ) : (
                                            incomeSourceComparison.map((source) => (
                                                <tr key={source.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="h-3 w-3 rounded"
                                                                style={{
                                                                    backgroundColor: source.color || '#10B981',
                                                                }}
                                                            />
                                                            {source.name}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(source.year1Amount)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(source.year2Amount)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <DifferenceCell 
                                                            val1={source.year1Amount} 
                                                            val2={source.year2Amount}
                                                            isExpense={false}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
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


