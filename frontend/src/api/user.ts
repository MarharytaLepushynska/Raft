import { api } from '@/api/http';
import type { User } from '@/types/user';

export async function getUser(): Promise<User> {
  return api.get<User>('/users/me');
}

export async function deleteUser(): Promise<void> {
  return api.delete<void>('/users/me');
}

export async function searchUsers(q: string): Promise<User[]> {
  return api.get<User[]>(`/users/search?q=${encodeURIComponent(q)}`);
}
