import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';

export default function Create() {
    const form = useForm({
        name: '',
        color: '#8B5CF6',
        order: 0,
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('income-sources.store'), {
            onSuccess: () => {
                router.visit(route('income-sources.index'));
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                    Create Income Source
                </h2>
            }
        >
            <Head title="Create Income Source" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <form onSubmit={submit} className="p-6">
                            <div className="space-y-6">
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
                                        placeholder="e.g., Salary, Freelance, etc."
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
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.visit(
                                            route('income-sources.index'),
                                        )
                                    }
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <PrimaryButton
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    Create Income Source
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
