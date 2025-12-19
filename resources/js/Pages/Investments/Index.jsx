import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency } from '@/utils/currency';
import { Head } from '@inertiajs/react';

export default function Investments({ breakdown, years, yearTotals, grandTotal }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                        Investments Breakdown
                    </h2>
                </div>
            }
        >
            <Head title="Investments" />

            <div className="py-6">
                <div className="mx-auto max-w-[1560px] sm:px-6 lg:px-8">
                    {/* Summary Card */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Total Investments
                            </div>
                            <div className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                                {formatCurrency(grandTotal)}
                            </div>
                        </div>
                    </div>

                    {/* Investments Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Category
                                        </th>
                                        {years.map((year) => (
                                            <th
                                                key={year}
                                                className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                                            >
                                                {year}
                                            </th>
                                        ))}
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {breakdown.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center">
                                                    <div
                                                        className="mr-3 h-4 w-4 rounded"
                                                        style={{
                                                            backgroundColor: category.color,
                                                        }}
                                                    />
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {category.name}
                                                    </div>
                                                </div>
                                            </td>
                                            {years.map((year) => (
                                                <td
                                                    key={year}
                                                    className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100"
                                                >
                                                    {category.years[year] > 0
                                                        ? formatCurrency(
                                                              category.years[year],
                                                          )
                                                        : '-'}
                                                </td>
                                            ))}
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(category.total)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    <tr className="bg-gray-50 font-semibold dark:bg-gray-900">
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                                            Total
                                        </td>
                                        {years.map((year) => (
                                            <td
                                                key={year}
                                                className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-gray-100"
                                            >
                                                {formatCurrency(
                                                    yearTotals[year] || 0,
                                                )}
                                            </td>
                                        ))}
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-purple-600 dark:text-purple-400">
                                            {formatCurrency(grandTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Empty State */}
                    {breakdown.length === 0 && (
                        <div className="mt-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="p-12 text-center">
                                <p className="text-gray-500 dark:text-gray-400">
                                    No investments found. Start adding investment
                                    transactions to see them here.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}


