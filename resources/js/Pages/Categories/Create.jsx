import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';

export default function Create({ parentCategories }) {
    const form = useForm({
        name: '',
        color: '#8B5CF6',
        parent_id: null,
        order: 0,
        is_investment: false,
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('categories.store'), {
            onSuccess: () => {
                router.visit(route('categories.index'));
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                    Create Category
                </h2>
            }
        >
            <Head title="Create Category" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <form onSubmit={submit} className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Category Type
                                    </label>
                                    <div className="mt-2 space-y-2">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="category_type"
                                                value="parent"
                                                checked={
                                                    form.data.parent_id === null
                                                }
                                                onChange={() =>
                                                    form.setData(
                                                        'parent_id',
                                                        null,
                                                    )
                                                }
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                Parent Category
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="category_type"
                                                value="subcategory"
                                                checked={
                                                    form.data.parent_id !== null
                                                }
                                                onChange={() => {
                                                    if (
                                                        parentCategories.length >
                                                        0
                                                    ) {
                                                        form.setData(
                                                            'parent_id',
                                                            parentCategories[0]
                                                                .id,
                                                        );
                                                    }
                                                }}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                Subcategory
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {form.data.parent_id !== null && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Parent Category
                                        </label>
                                        <select
                                            value={form.data.parent_id || ''}
                                            onChange={(e) =>
                                                form.setData(
                                                    'parent_id',
                                                    e.target.value
                                                        ? parseInt(
                                                              e.target.value,
                                                          )
                                                        : null,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                            required={
                                                form.data.parent_id !== null
                                            }
                                        >
                                            <option value="">
                                                Select a parent category
                                            </option>
                                            {parentCategories.map((cat) => (
                                                <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
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
                                            value={form.data.color}
                                            onChange={(e) =>
                                                form.setData(
                                                    'color',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 w-20 cursor-pointer rounded border-gray-300"
                                        />
                                        <input
                                            type="text"
                                            value={form.data.color}
                                            onChange={(e) =>
                                                form.setData(
                                                    'color',
                                                    e.target.value,
                                                )
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
                                            checked={form.data.is_investment}
                                            onChange={(e) =>
                                                form.setData(
                                                    'is_investment',
                                                    e.target.checked,
                                                )
                                            }
                                            className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Mark as Investment Category
                                        </span>
                                    </label>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Transactions in this category will be
                                        treated as investments, not expenses.
                                        They will be added to your total
                                        investments and included in net worth
                                        calculations.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.visit(route('categories.index'))
                                    }
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <PrimaryButton
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    Create Category
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
