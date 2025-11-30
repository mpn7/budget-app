import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Settings({ year, startingBalance, initialInvestment }) {
    const [selectedYear, setSelectedYear] = useState(year);

    const startingBalanceForm = useForm({
        amount: startingBalance || '',
        year: year,
    });

    const initialInvestmentForm = useForm({
        amount: initialInvestment || '',
        year: year,
    });

    // Sync selectedYear state with year prop when it changes
    useEffect(() => {
        setSelectedYear(year);
        startingBalanceForm.setData('year', year);
        initialInvestmentForm.setData('year', year);
    }, [year]);

    const handleYearChange = (newYear) => {
        setSelectedYear(newYear);
        router.get(route('settings.index'), { year: newYear }, { preserveState: true });
    };

    const handleStartingBalanceSubmit = (e) => {
        e.preventDefault();
        startingBalanceForm.setData('year', selectedYear);
        startingBalanceForm.post(route('settings.starting-balance'), {
            preserveScroll: true,
        });
    };

    const handleInitialInvestmentSubmit = (e) => {
        e.preventDefault();
        initialInvestmentForm.setData('year', selectedYear);
        initialInvestmentForm.post(route('settings.initial-investment'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                        Settings
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
                    </div>
                </div>
            }
        >
            <Head title="Settings" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {/* Starting Balance Card */}
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Starting Balance
                                </h3>
                                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                    Set your account balance at the start of{' '}
                                    {selectedYear}. The balance will be calculated
                                    automatically for each month.
                                </p>
                                <form onSubmit={handleStartingBalanceSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Starting Balance for {selectedYear}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={startingBalanceForm.data.amount}
                                                onChange={(e) =>
                                                    startingBalanceForm.setData(
                                                        'amount',
                                                        parseFloat(e.target.value) || 0,
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <PrimaryButton
                                            type="submit"
                                            disabled={startingBalanceForm.processing}
                                        >
                                            Save Starting Balance
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Initial Investment Card */}
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Initial Investment
                                </h3>
                                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                    Set your initial investment amount at the start
                                    of {selectedYear}. Additional investments made
                                    through investment categories will be added to
                                    this.
                                </p>
                                <form onSubmit={handleInitialInvestmentSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Initial Investment for {selectedYear}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={initialInvestmentForm.data.amount}
                                                onChange={(e) =>
                                                    initialInvestmentForm.setData(
                                                        'amount',
                                                        parseFloat(e.target.value) || 0,
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <PrimaryButton
                                            type="submit"
                                            disabled={initialInvestmentForm.processing}
                                        >
                                            Save Initial Investment
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}


