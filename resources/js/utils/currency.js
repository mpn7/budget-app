/**
 * Format a number as currency in EUR
 * @param {number|string} amount - The amount to format
 * @param {Object} options - Optional formatting options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, options = {}) {
    // Handle null, undefined, empty string, or zero
    if (amount === null || amount === undefined || amount === '' || amount === '0' || amount === '0.00') {
        if (options.showZero !== false) {
            return new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
            }).format(0);
        }
        return '';
    }

    const num = parseFloat(amount);
    
    // Handle NaN
    if (isNaN(num)) {
        return '';
    }

    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: options.minimumFractionDigits ?? 2,
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
    }).format(num);
}


