import { useState, type ReactNode } from 'react';
import { Icon } from '@/lib/icons';
import { MultiSelectFilter } from '@/components/common/MultiSelectFilter';
import { SingleSelectFilter } from '@/components/common/SingleSelectFilter';
import { capitalize } from '@/lib/utils';
import { colorHex } from '@/lib/workspaceColors';
import { buildTaskSections, formatTaskDue, getTaskState, priorityLabels, priorityOptions, statusLabels,
  taskSorter, type TaskSort, type TaskStatusFilter,} from '@/lib/tasks';
import type { Task } from '@/types/task';
import './TaskBoard.css';

const STATUS_VALUES: TaskStatusFilter[] = ['all', 'active', 'completed'];

interface TaskBoardProps {
  tasks: Task[];
  loading?: boolean;
  emptyText?: string;
  showSpace?: boolean;
  extraFilter?: ReactNode;
  matchExtra?: (task: Task) => boolean;
  renderAssignee?: (task: Task) => ReactNode;
  renderReminder?: (task: Task) => ReactNode;
  onSelect: (task: Task) => void;
  onCycle: (task: Task) => void;
  onAdd: () => void;
}

export function TaskBoard({ tasks, loading, emptyText = 'No tasks yet.', showSpace, extraFilter, matchExtra,
                            renderAssignee, renderReminder, onSelect, onCycle, onAdd,
}: TaskBoardProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(() => new Set());
  const [sort, setSort] = useState<TaskSort>('deadline');
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(['completed']));

  const toggleSection = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const query = search.trim().toLowerCase();
  const matches = (task: Task) =>
    (!query || task.title.toLowerCase().includes(query)) &&
    (priorityFilter.size === 0 || priorityFilter.has(task.priority)) &&
    (!matchExtra || matchExtra(task));
  const active = tasks.filter((task) => task.status !== 'COMPLETED').filter(matches);
  const completed = tasks.filter((task) => task.status === 'COMPLETED').filter(matches);
  const sections = buildTaskSections(active, completed, new Date(), taskSorter(sort), statusFilter);

  const total = tasks.length;
  const done = tasks.filter((task) => task.status === 'COMPLETED').length;
  const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  const renderRow = (task: Task) => {
    const overdue = getTaskState(task) === 'overdue';
    return (
      <li key={task.id} className="task-row" data-done={task.status === 'COMPLETED'} data-overdue={overdue}>
        <button
          type="button"
          className="task-status"
          data-status={task.status}
          onClick={() => onCycle(task)}
          aria-label={`Status: ${statusLabels[task.status]}, click to change`}
        >
          <span className="task-status__dot">{task.status === 'COMPLETED' && <Icon name="check" size={12} />}</span>
          <span className="task-status__tip">
            {statusLabels[task.status]}
            <span className="task-status__tip-sub">click to change</span>
          </span>
        </button>
        <div className="task-row__body" onClick={() => onSelect(task)}>
          <div className="task-row__head">
            {showSpace && (
              <span
                className="task-row__space-dot"
                style={{ background: colorHex(task.workspaceColor) }}
                title={task.workspaceName}
              />
            )}
            <span className="task-row__title">{task.title}</span>
            <span className={`task-row__priority task-row__priority--${task.priority.toLowerCase()}`}>
              {priorityLabels[task.priority]}
            </span>
          </div>
          {task.description && <p className="task-row__desc">{task.description}</p>}
          <p className="task-row__due" data-overdue={overdue}>
            {formatTaskDue(task)}
          </p>
          {renderAssignee && <div className="task-row__author">{renderAssignee(task)}</div>}
        </div>
        {renderReminder && <div className="task-row__reminder">{renderReminder(task)}</div>}
      </li>
    );
  };

  return (
    <div className="task-board">
      {total > 0 && (
        <div className="task-board__progress">
          <div className="task-board__track">
            <span className="task-board__fill task-board__fill--done" style={{ width: `${(done / total) * 100}%` }} />
            <span
              className="task-board__fill task-board__fill--progress"
              style={{ width: `${(inProgress / total) * 100}%` }}
            />
          </div>
          <span className="task-board__progress-label">
            {done} of {total} done · {percent}%
          </span>
        </div>
      )}

      <div className="task-board__bar">
        <div className="task-board__search">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Search tasks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button type="button" className="task-board__add" onClick={onAdd}>
          <Icon name="plus" size={16} />
          Add task
        </button>
      </div>

      {total > 0 && (
        <div className="task-board__filters">
          <div className="task-board__chips">
            {STATUS_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                className="task-board__chip"
                data-active={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              >
                {capitalize(value)}
              </button>
            ))}
          </div>
          <MultiSelectFilter
            options={priorityOptions}
            selected={priorityFilter}
            onChange={setPriorityFilter}
            allLabel="All priorities"
            countNoun="priorities"
          />
          {extraFilter}
          <SingleSelectFilter
            options={[
              { id: 'deadline', label: 'By date' },
              { id: 'priority', label: 'By priority' },
            ]}
            value={sort}
            onChange={(value) => setSort(value as TaskSort)}
          />
        </div>
      )}

      {loading ? (
        <p className="task-board__muted">Loading&hellip;</p>
      ) : total === 0 ? (
        <p className="task-board__muted">{emptyText}</p>
      ) : sections.length === 0 ? (
        <p className="task-board__muted">No tasks match the filters.</p>
      ) : (
        <div className="task-board__sections">
          {sections.map((section) => {
            const open = !collapsed.has(section.key);
            return (
              <section key={section.key} className="task-board__section">
                <button
                  type="button"
                  className="task-board__section-head"
                  data-open={open}
                  onClick={() => toggleSection(section.key)}
                >
                  <Icon name="chevron-down" size={16} />
                  <h3
                    className={`task-board__section-title${section.overdue ? ' task-board__section-title--overdue' : ''}`}
                  >
                    {section.title}
                  </h3>
                  <span className="task-board__section-count">{section.tasks.length}</span>
                </button>
                {open && <ul className="task-board__list">{section.tasks.map(renderRow)}</ul>}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
