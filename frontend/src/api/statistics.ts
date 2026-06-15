import { api } from '@/api/http';
import type { StatisticsResponse, StatsPeriod } from '@/types/statistics';

export function getStatistics(period: StatsPeriod): Promise<StatisticsResponse> {
    return api.get<StatisticsResponse>(`/statistics?period=${period}`);
}
