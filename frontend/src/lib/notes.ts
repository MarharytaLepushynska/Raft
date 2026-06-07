export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    });
}

export function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
}