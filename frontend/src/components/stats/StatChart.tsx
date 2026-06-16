import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
} from 'chart.js';
import type { ChartPointResponse } from '@/types/statistics';
import {useTheme} from "@/theme/ThemeContext.tsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Props {
    title: string;
    data: ChartPointResponse[];
    valueKey: 'count' | 'amount';
    yLabel: string;
    color?: string;
}

/** Draws one statistics series as bars, tinted with the current accent color. */
export function StatChart({ title, data, valueKey, yLabel, color }: Props) {
    const { accent } = useTheme();
    const chartColor = color ?? accent;

    const labels = data.map((d) => d.label);
    const values = data.map((d) => (valueKey === 'amount' ? d.amount ?? 0 : d.count));

    return (
        <div className="stat-chart">
            <p className="stat-chart__title">{title}</p>
            <div className="stat-chart__canvas">
                <Bar
                    data={{
                        labels,
                        datasets: [
                            {
                                data: values,
                                backgroundColor: chartColor,
                                borderRadius: 6,
                            },
                        ],
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: true },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: { display: true, text: yLabel },
                                ticks: { precision: 0 },
                            },
                            x: {
                                title: { display: true, text: 'Time' },
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
}
