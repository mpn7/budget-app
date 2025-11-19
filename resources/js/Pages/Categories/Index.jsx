import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ categories }) {
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingSubcategory, setEditingSubcategory] = useState(null);
    const [showAddSubcategory, setShowAddSubcategory] = useState(null);

    const handleDelete = (id, isSubcategory = false) => {
        if (
            confirm(
                `Are you sure you want to delete this ${isSubcategory ? 'subcategory' : 'category'}?`,
            )
        ) {
            router.delete(route('categories.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                        Categories
                    </h2>
                    <PrimaryButton
                        onClick={() => router.visit(route('categories.create'))}
                    >
                        Add Category
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Categories" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="p-6">
                            {categories.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="mb-4 text-gray-500 dark:text-gray-400">
                                        No categories found.
                                    </p>
                                    <PrimaryButton
                                        onClick={() =>
                                            router.visit(
                                                route('categories.create'),
                                            )
                                        }
                                    >
                                        Create Your First Category
                                    </PrimaryButton>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {categories.map((category) => (
                                        <div
                                            key={category.id}
                                            className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0 dark:border-gray-700"
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="h-5 w-5 rounded"
                                                        style={{
                                                            backgroundColor:
                                                                category.color ||
                                                                '#8B5CF6',
                                                        }}
                                                    />
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                        {category.name}
                                                    </h3>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            setEditingCategory(
                                                                category,
                                                            )
                                                        }
                                                        className="text-sm text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                category.id,
                                                            )
                                                        }
                                                        className="text-sm text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setShowAddSubcategory(
                                                                category.id,
                                                            )
                                                        }
                                                        className="text-sm text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                                    >
                                                        Add Subcategory
                                                    </button>
                                                </div>
                                            </div>

                                            {category.children &&
                                                category.children.length >
                                                    0 && (
                                                    <div className="ml-8 space-y-2">
                                                        {category.children.map(
                                                            (subcategory) => (
                                                                <div
                                                                    key={
                                                                        subcategory.id
                                                                    }
                                                                    className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-2 dark:bg-gray-700"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div
                                                                            className="h-3 w-3 rounded"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    subcategory.color ||
                                                                                    '#8B5CF6',
                                                                            }}
                                                                        />
                                                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                                                            {
                                                                                subcategory.name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex gap-3">
                                                                        <button
                                                                            onClick={() =>
                                                                                setEditingSubcategory(
                                                                                    subcategory,
                                                                                )
                                                                            }
                                                                            className="text-xs text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDelete(
                                                                                    subcategory.id,
                                                                                    true,
                                                                                )
                                                                            }
                                                                            className="text-xs text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                            {showAddSubcategory ===
                                                category.id && (
                                                <CategoryForm
                                                    parentId={category.id}
                                                    onSuccess={() => {
                                                        setShowAddSubcategory(
                                                            null,
                                                        );
                                                        router.reload();
                                                    }}
                                                    onCancel={() =>
                                                        setShowAddSubcategory(
                                                            null,
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Category Modal */}
            {editingCategory && (
                <CategoryForm
                    category={editingCategory}
                    onSuccess={() => {
                        setEditingCategory(null);
                        router.reload();
                    }}
                    onCancel={() => setEditingCategory(null)}
                />
            )}

            {/* Edit Subcategory Modal */}
            {editingSubcategory && (
                <CategoryForm
                    category={editingSubcategory}
                    onSuccess={() => {
                        setEditingSubcategory(null);
                        router.reload();
                    }}
                    onCancel={() => setEditingSubcategory(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}

function CategoryForm({ category, parentId, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: category?.name || '',
        color: category?.color || '#8B5CF6',
        parent_id: parentId || category?.parent_id || null,
        order: category?.order || 0,
        is_investment: category?.is_investment || false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const url = category
            ? route('categories.update', category.id)
            : route('categories.store');
        const method = category ? 'put' : 'post';

        router[method](
            url,
            {
                ...formData,
                parent_id: formData.parent_id || null,
            },
            {
                onSuccess: () => {
                    onSuccess();
                },
                preserveScroll: true,
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {category
                        ? 'Edit Category'
                        : parentId
                          ? 'Add Subcategory'
                          : 'Add Category'}
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
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_investment}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            is_investment: e.target.checked,
                                        })
                                    }
                                    className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Mark as Investment Category
                                </span>
                            </label>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Transactions in this category will be treated as
                                investments, not expenses. They will be added to
                                your total investments and included in net worth
                                calculations.
                            </p>
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
                            {category ? 'Update' : 'Create'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
