import type { StatsPeriod } from '@/types/statistics';

const PERIODS: { value: StatsPeriod; label: string }[] = [
    { value: 'WEEK', label: 'Week' },
    { value: 'MONTH', label: 'Month' },
    { value: 'YEAR', label: 'Year' },
];

interface Props {
    value: StatsPeriod;
    onChange: (value: StatsPeriod) => void;
}

/** Week / Month / Year toggle for the statistics period. */
export function PeriodFilter({ value, onChange }: Props) {
    return (
        <div className="period-filter">
            {PERIODS.map((p) => (
                <button
                    key={p.value}
                    type="button"
                    className={`period-filter__btn ${value === p.value ? 'period-filter__btn--active' : ''}`}
                    onClick={() => onChange(p.value)}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}
