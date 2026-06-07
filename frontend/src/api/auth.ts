import { api } from '@/api/http';
import type { User } from '@/types/user';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/login', { email, password });
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register', input);
}
