import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency } from '@/utils/currency';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({
    transactions,
    categories,
    filters,
    totalAmount,
}) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [currentFilters, setCurrentFilters] = useState(filters);

    const form = useForm({
        category_id: '',
        amount: '',
        description: '',
        month: currentFilters.month || new Date().getMonth() + 1,
        year: currentFilters.year || new Date().getFullYear(),
        date: '',
    });

    const getFlatCategories = () => {
        const flat = [];
        categories.forEach((cat) => {
            flat.push(cat);
            cat.children?.forEach((sub) => flat.push(sub));
        });
        return flat;
    };


    const handleFilterChange = (key, value) => {
        const newFilters = { ...currentFilters, [key]: value };
        setCurrentFilters(newFilters);
        router.get(
            route('transactions.index'),
            { ...newFilters },
            { preserveState: true },
        );
    };

    const submitForm = (e) => {
        e.preventDefault();
        const routeName = editingTransaction
            ? 'transactions.update'
            : 'transactions.store';
        const routeParams = editingTransaction
            ? { transaction: editingTransaction.id }
            : {};

        form[editingTransaction ? 'put' : 'post'](
            route(routeName, routeParams),
            {
                onSuccess: () => {
                    setShowAddModal(false);
                    setEditingTransaction(null);
                    form.reset();
                },
            },
        );
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        form.setData({
            category_id: transaction.category_id,
            amount: transaction.amount,
            description: transaction.description || '',
            month: transaction.month,
            year: transaction.year,
            date: transaction.date || '',
        });
        setShowAddModal(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            router.delete(route('transactions.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingTransaction(null);
        form.reset();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                        Expenses
                    </h2>
                    <div className="flex gap-3">
                        <PrimaryButton
                            onClick={() =>
                                router.visit(route('transactions.create'))
                            }
                        >
                            Add Expenses (Bulk)
                        </PrimaryButton>
                        <PrimaryButton onClick={() => setShowAddModal(true)}>
                            Add Single Expense
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title="Expenses" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Year
                                </label>
                                <select
                                    value={currentFilters.year || ''}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'year',
                                            e.target.value
                                                ? parseInt(e.target.value)
                                                : null,
                                        )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    <option value="">All Years</option>
                                    {Array.from({ length: 10 }, (_, i) => {
                                        const y =
                                            new Date().getFullYear() - 5 + i;
                                        return (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Month
                                </label>
                                <select
                                    value={currentFilters.month || ''}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'month',
                                            e.target.value
                                                ? parseInt(e.target.value)
                                                : null,
                                        )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    <option value="">All Months</option>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const monthNum = i + 1;
                                        const date = new Date(
                                            2000,
                                            monthNum - 1,
                                            1,
                                        );
                                        return (
                                            <option
                                                key={monthNum}
                                                value={monthNum}
                                            >
                                                {date.toLocaleString(
                                                    'default',
                                                    {
                                                        month: 'long',
                                                    },
                                                )}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Category
                                </label>
                                <select
                                    value={currentFilters.category_id || ''}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'category_id',
                                            e.target.value
                                                ? parseInt(e.target.value)
                                                : null,
                                        )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    <option value="">All Categories</option>
                                    {getFlatCategories().map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.parent_id
                                                ? `  ${cat.name}`
                                                : cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <div className="w-full rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Total
                                    </div>
                                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                        {formatCurrency(totalAmount)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {transactions.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                No transactions found. Click
                                                "Add Expense" to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.data.map((transaction) => (
                                            <tr
                                                key={transaction.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                                    {transaction.date
                                                        ? new Date(
                                                              transaction.date,
                                                          ).toLocaleDateString()
                                                        : `${transaction.month}/${transaction.year}`}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded"
                                                            style={{
                                                                backgroundColor:
                                                                    transaction
                                                                        .category
                                                                        ?.color ||
                                                                    '#8B5CF6',
                                                            }}
                                                        />
                                                        <span className="text-gray-900 dark:text-gray-100">
                                                            {
                                                                transaction
                                                                    .category
                                                                    ?.name
                                                            }
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {transaction.description ||
                                                        '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400">
                                                    {formatCurrency(
                                                        transaction.amount,
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleEdit(
                                                                    transaction,
                                                                )
                                                            }
                                                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    transaction.id,
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {transactions.links &&
                            transactions.links.length > 3 && (
                                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6 dark:border-gray-700 dark:bg-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-1 justify-between sm:hidden">
                                            {transactions.links[0].url && (
                                                <Link
                                                    href={
                                                        transactions.links[0]
                                                            .url
                                                    }
                                                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    Previous
                                                </Link>
                                            )}
                                            {transactions.links[
                                                transactions.links.length - 1
                                            ].url && (
                                                <Link
                                                    href={
                                                        transactions.links[
                                                            transactions.links
                                                                .length - 1
                                                        ].url
                                                    }
                                                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    Next
                                                </Link>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    Showing{' '}
                                                    <span className="font-medium">
                                                        {transactions.from}
                                                    </span>{' '}
                                                    to{' '}
                                                    <span className="font-medium">
                                                        {transactions.to}
                                                    </span>{' '}
                                                    of{' '}
                                                    <span className="font-medium">
                                                        {transactions.total}
                                                    </span>{' '}
                                                    results
                                                </p>
                                            </div>
                                            <div>
                                                <nav
                                                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                                                    aria-label="Pagination"
                                                >
                                                    {transactions.links.map(
                                                        (link, index) => (
                                                            <Link
                                                                key={index}
                                                                href={
                                                                    link.url ||
                                                                    '#'
                                                                }
                                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                                    link.active
                                                                        ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                                                                        : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700'
                                                                } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: link.label,
                                                                }}
                                                            />
                                                        ),
                                                    )}
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {editingTransaction
                                ? 'Edit Expense'
                                : 'Add Expense'}
                        </h3>
                        <form onSubmit={submitForm}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Category
                                    </label>
                                    <select
                                        value={form.data.category_id}
                                        onChange={(e) =>
                                            form.setData(
                                                'category_id',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                        required
                                    >
                                        <option value="">
                                            Select a category
                                        </option>
                                        {getFlatCategories().map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.parent_id
                                                    ? `  ${cat.name}`
                                                    : cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={form.data.amount}
                                        onChange={(e) =>
                                            form.setData(
                                                'amount',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.description}
                                        onChange={(e) =>
                                            form.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Month
                                        </label>
                                        <select
                                            value={form.data.month}
                                            onChange={(e) =>
                                                form.setData(
                                                    'month',
                                                    parseInt(e.target.value),
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                            required
                                        >
                                            {Array.from(
                                                { length: 12 },
                                                (_, i) => {
                                                    const monthNum = i + 1;
                                                    const date = new Date(
                                                        2000,
                                                        monthNum - 1,
                                                        1,
                                                    );
                                                    return (
                                                        <option
                                                            key={monthNum}
                                                            value={monthNum}
                                                        >
                                                            {date.toLocaleString(
                                                                'default',
                                                                {
                                                                    month: 'long',
                                                                },
                                                            )}
                                                        </option>
                                                    );
                                                },
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Year
                                        </label>
                                        <input
                                            type="number"
                                            value={form.data.year}
                                            onChange={(e) =>
                                                form.setData(
                                                    'year',
                                                    parseInt(e.target.value),
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Date (optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={form.data.date}
                                        onChange={(e) =>
                                            form.setData('date', e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <PrimaryButton
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {editingTransaction ? 'Update' : 'Add'}{' '}
                                    Expense
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
