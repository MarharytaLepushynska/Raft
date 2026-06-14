import { useState } from 'react';
import { TaskModal } from '@/components/task/TaskModal';
import { MultiSelectFilter } from '@/components/common/MultiSelectFilter';
import { TaskBoard } from '@/components/common/TaskBoard';
import { TaskAchievements } from '@/components/achievements/TaskAchievements';
import { useAuth } from '@/auth/AuthContext';
import { defaultAssigneeId, isMyTask, nextStatus } from '@/lib/tasks';
import { useTasks } from '@/hooks/tasks/useTasks';
import { useWorkspaces } from '@/hooks/workspaces/useWorkspaces';
import type { Task } from '@/types/task';
import './TodoPage.css';

export function TodoPage() {
  const { user } = useAuth();
  const { tasks, loading, create, update, remove } = useTasks();
  const { workspaces, spaceOptions } = useWorkspaces();
  const [selectedSpaces, setSelectedSpaces] = useState<Set<string>>(() => new Set());
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);

  const cycleStatus = (task: Task) => update(task.id, { status: nextStatus[task.status] });

  const handleCreate = (input: Omit<Task, 'id'>) =>
    create({ ...input, assigneeId: defaultAssigneeId(input.workspaceId, workspaces, user?.id) }).then(() =>
      setModalTask(undefined),
    );
  const handleUpdate = (id: string, patch: Partial<Task>) => update(id, patch).then(() => setModalTask(undefined));
  const handleDelete = (id: string) => remove(id).then(() => setModalTask(undefined));

  const myTasks = tasks.filter((task) => isMyTask(task, user?.id));
  const remaining = myTasks.filter((task) => task.status !== 'COMPLETED').length;
  const completed = myTasks.filter((task) => task.status === 'COMPLETED').length;

  return (
    <div className="todo">
      <div className="todo__main">
        {!loading && (
          <p className="todo__subtitle">
            {remaining === 0 ? 'All done — nice work!' : `${remaining} task${remaining === 1 ? '' : 's'} left`}
          </p>
        )}

        <TaskBoard tasks={myTasks} loading={loading} emptyText="No tasks yet — add your first one." showSpace
          matchExtra={(task) =>
            selectedSpaces.size === 0 || (!!task.workspaceId && selectedSpaces.has(task.workspaceId))
          }
          extraFilter={
            workspaces.length > 0 ? (
              <MultiSelectFilter
                options={spaceOptions}
                selected={selectedSpaces}
                onChange={setSelectedSpaces}
                allLabel="All spaces"
                countNoun="spaces"
                icon="spaces"
              />
            ) : null
          }
          onSelect={setModalTask}
          onCycle={cycleStatus}
          onAdd={() => setModalTask(null)}
        />
      </div>

      <aside className="todo__side">
        <TaskAchievements completedCount={completed} />
      </aside>

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(undefined)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
