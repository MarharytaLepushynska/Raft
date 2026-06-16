import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { byDueTime, getTaskState, isDueOn, priorityLabels, todayISO } from '@/lib/tasks';
import { colorHex } from '@/lib/workspaceColors';
import { Icon } from '@/lib/icons';
import type { Task, TaskState } from '@/types/task';
import './TodayTasksWidget.css';

const MAX_TODAY = 5;

type Row = { task: Task; state: TaskState };

interface TodayTasksWidgetProps {
  tasks: Task[];
  loading: boolean;
  error?: boolean;
  onComplete?: (id: string) => void;
}

/** Dashboard widget: today's tasks on a timeline (up to 5), each with a quick complete button. */
export function TodayTasksWidget({ tasks, loading, error, onComplete }: TodayTasksWidgetProps) {
  const now = new Date();

  const activeOn = (isoDate: string): Row[] =>
    tasks
      .filter((task) => isDueOn(task, isoDate) && task.status !== 'COMPLETED')
      .sort(byDueTime)
      .map((task) => ({ task, state: getTaskState(task, now) }));

  const todayRows = activeOn(todayISO(now));
  const visibleToday = todayRows.slice(0, MAX_TODAY);
  const moreToday = todayRows.length - visibleToday.length;

  const firstUpcoming = visibleToday.findIndex(({ state }) => state === 'upcoming');
  const nowAt = firstUpcoming > 0 ? firstUpcoming : -1;

  const renderRows = (rows: Row[], nowIndex: number) => (
    <ol className="timeline">
      {rows.map(({ task, state }, index) => {
        const overdue = state === 'overdue';
        return (
          <Fragment key={task.id}>
            {index === nowIndex && (
              <li className="timeline__now" aria-hidden="true">
                <span>now</span>
              </li>
            )}
            <li className="timeline__row">
              <div className="timeline__time">
                <span className={`timeline__clock${overdue ? ' timeline__clock--overdue' : ''}`}>
                  {task.dueTime ?? '—'}
                </span>
                <span className="timeline__rail" />
              </div>
              <div className={`timeline__card${overdue ? ' timeline__card--overdue' : ''}`}>
                <button
                  type="button"
                  className="timeline__check"
                  onClick={() => onComplete?.(task.id)}
                  aria-label={`Mark "${task.title}" as done`}
                  title="Mark as done"
                >
                  <Icon name="check" size={13} />
                </button>
                <div className="timeline__content">
                  <span className={`timeline__priority timeline__priority--${task.priority.toLowerCase()}`}>
                    {priorityLabels[task.priority]}
                  </span>
                  <p className="timeline__name">
                    {task.title}
                    {overdue && <span className="timeline__tag">Overdue</span>}
                  </p>
                  {task.description && <p className="timeline__desc">{task.description}</p>}
                  {task.workspaceName && (
                    <p className="timeline__space">
                      <span className="timeline__space-dot" style={{ background: colorHex(task.workspaceColor) }} />
                      {task.workspaceName}
                    </p>
                  )}
                </div>
              </div>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );

  return (
    <section className="today-tasks">
      <header className="today-tasks__head">
        <span className="today-tasks__title">Today&rsquo;s tasks</span>
        <span className="today-tasks__date">
          {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </header>

      {error ? (
        <p className="today-tasks__muted">Couldn&rsquo;t load tasks.</p>
      ) : loading ? (
        <p className="today-tasks__muted">Loading&hellip;</p>
      ) : todayRows.length > 0 ? (
        <>
          {renderRows(visibleToday, nowAt)}
          {moreToday > 0 && <p className="today-tasks__more">+{moreToday} more today</p>}
        </>
      ) : (
        <p className="today-tasks__muted">All done for today &mdash; nice work!</p>
      )}

      <Link to="/todo" className="today-tasks__view-all">
        View all
      </Link>
    </section>
  );
}
