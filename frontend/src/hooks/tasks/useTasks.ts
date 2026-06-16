import { useEffect, useState } from 'react';
import { createTask, deleteTask, getTasks, updateTask } from '@/api/tasks';
import type { Task } from '@/types/task';

interface UseTasksOptions {
  workspaceId?: string;
}

/** Loads tasks and lets you create/update/remove them. Pass a workspaceId to keep only that space's tasks. */
export function useTasks({ workspaceId }: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getTasks()
      .then((all) => {
        if (!active) return;
        setTasks(workspaceId ? all.filter((task) => task.workspaceId === workspaceId) : all);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const create = async (input: Omit<Task, 'id'>): Promise<Task> => {
    const created = await createTask(input);
    setTasks((prev) => (workspaceId && created.workspaceId !== workspaceId ? prev : [created, ...prev]));
    return created;
  };

  const update = async (id: string, patch: Partial<Task>): Promise<Task> => {
    const updated = await updateTask(id, patch);
    setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
    return updated;
  };

  const remove = async (id: string): Promise<void> => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return { tasks, loading, create, update, remove };
}
