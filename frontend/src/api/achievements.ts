import { api } from '@/api/http';
import type { Achievement } from '@/types/achievement';

export async function getAchievements(): Promise<Achievement[]> {
    return api.get<Achievement[]>('/achievements');
}