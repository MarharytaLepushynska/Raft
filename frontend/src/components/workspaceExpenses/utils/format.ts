/** Formats a number as hryvnia currency. */
export const fmt = (n: number) =>
    new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: 'UAH',
        maximumFractionDigits: 0,
    }).format(n);
