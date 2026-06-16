import { useEffect, useState } from 'react';
import { getStatistics } from '@/api/statistics';
import type { StatisticsResponse, StatsPeriod } from '@/types/statistics';
import { PeriodFilter } from '@/components/stats/PeriodFilter';
import { StatChart } from '@/components/stats/StatChart';
import { TopWorkspacesList } from '@/components/stats/TopWorkspacesList';
import { AchievementsList } from '@/components/achievements/AchievementsList';
import './StatisticsPage.css';

/** The Statistics page: task and expense charts for the chosen period, top workspaces, and achievements. */
export function StatisticsPage() {
    const [period, setPeriod] = useState<StatsPeriod>('WEEK');
    const [stats, setStats] = useState<StatisticsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);

        getStatistics(period)
            .then((data) => { if (active) setStats(data); })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [period]);

    return (
        <div className="stats-page">
            <PeriodFilter value={period} onChange={setPeriod} />

            {loading || !stats ? (
                <p className="wpage__muted">Loading…</p>
            ) : (
                <>
                    <div className="stats-page__charts">
                        <StatChart
                            title="Tasks created"
                            data={stats.taskStats}
                            valueKey="count"
                            yLabel="Number of tasks"
                        />
                        <StatChart
                            title="Expense statistics"
                            data={stats.expenseStats}
                            valueKey="amount"
                            yLabel="Amount spent"
                        />
                    </div>

                    <div className="stats-page__bottom">
                        <TopWorkspacesList workspaces={stats.topWorkspaces} />
                        <div className="stats-page__achievements">
                            <AchievementsList />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
