import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ incomeSources }) {
    const [editingSource, setEditingSource] = useState(null);

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this income source?')) {
            router.delete(route('income-sources.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                        Income Sources
                    </h2>
                    <PrimaryButton
                        onClick={() =>
                            router.visit(route('income-sources.create'))
                        }
                    >
                        Add Income Source
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Income Sources" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            {incomeSources.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="mb-4 text-gray-500 dark:text-gray-400">
                                        No income sources found.
                                    </p>
                                    <PrimaryButton
                                        onClick={() =>
                                            router.visit(
                                                route('income-sources.create'),
                                            )
                                        }
                                    >
                                        Create Your First Income Source
                                    </PrimaryButton>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {incomeSources.map((source) => (
                                        <div
                                            key={source.id}
                                            className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="h-5 w-5 rounded"
                                                        style={{
                                                            backgroundColor:
                                                                source.color ||
                                                                '#8B5CF6',
                                                        }}
                                                    />
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {source.name}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            setEditingSource(
                                                                source,
                                                            )
                                                        }
                                                        className="text-sm text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                source.id,
                                                            )
                                                        }
                                                        className="text-sm text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingSource && (
                <IncomeSourceForm
                    source={editingSource}
                    onSuccess={() => {
                        setEditingSource(null);
                        router.reload();
                    }}
                    onCancel={() => setEditingSource(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}

function IncomeSourceForm({ source, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: source?.name || '',
        color: source?.color || '#8B5CF6',
        order: source?.order || 0,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const url = source
            ? route('income-sources.update', source.id)
            : route('income-sources.store');
        const method = source ? 'put' : 'post';

        router[method](url, formData, {
            onSuccess: () => {
                onSuccess();
            },
            preserveScroll: true,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {source ? 'Edit Income Source' : 'Add Income Source'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Color
                            </label>
                            <div className="mt-1 flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            color: e.target.value,
                                        })
                                    }
                                    className="h-10 w-20 cursor-pointer rounded border-gray-300"
                                />
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            color: e.target.value,
                                        })
                                    }
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                    placeholder="#8B5CF6"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <PrimaryButton type="submit">
                            {source ? 'Update' : 'Create'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
