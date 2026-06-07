import { api } from '@/api/http';
import type { Task } from '@/types/task';

export async function getTasks(): Promise<Task[]> {
  return api.get<Task[]>('/tasks');
}

export async function createTask(input: Omit<Task, 'id'>): Promise<Task> {
  return api.post<Task>('/tasks', input);
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  return api.patch<Task>(`/tasks/${id}`, patch);
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete<void>(`/tasks/${id}`);
}
