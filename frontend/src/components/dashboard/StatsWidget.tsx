import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStatistics } from '@/api/statistics';
import { fmt } from '@/components/workspaceExpenses/utils/format';
import type { StatisticsResponse } from '@/types/statistics';
import './StatsWidget.css';

/** Dashboard "This week" widget: tasks created and total spent. */
export function StatsWidget() {
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getStatistics('WEEK')
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const tasksDone = stats ? stats.taskStats.reduce((sum, point) => sum + point.count, 0) : 0;
  const spent = stats ? stats.expenseStats.reduce((sum, point) => sum + (point.amount ?? 0), 0) : 0;

  return (
    <section className="dash-stats">
      <header className="dash-stats__head">
        <h2 className="dash-stats__title">This week</h2>
        <Link to="/statistics" className="dash-stats__view-all">
          Statistics
        </Link>
      </header>

      {loading ? (
        <p className="dash-stats__muted">Loading&hellip;</p>
      ) : error || !stats ? (
        <p className="dash-stats__muted">Couldn&rsquo;t load statistics.</p>
      ) : (
        <div className="dash-stats__grid">
          <div className="dash-stats__item">
            <span className="dash-stats__value">{tasksDone}</span>
            <span className="dash-stats__label">Tasks created</span>
          </div>
          <div className="dash-stats__item">
            <span className="dash-stats__value">{fmt(spent)}</span>
            <span className="dash-stats__label">Spent</span>
          </div>
        </div>
      )}
    </section>
  );
}
